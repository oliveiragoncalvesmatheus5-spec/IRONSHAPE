import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const MIGRATION_SQL = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_preferences jsonb DEFAULT NULL;`;

async function runMigrations() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log("[migration] SUPABASE_SERVICE_ROLE_KEY not set — skipping auto-migration.");
    return;
  }
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await admin.rpc("exec_sql", { sql: MIGRATION_SQL });
    if (error) {
      // Fallback: try via REST SQL endpoint
      const resp = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ sql: MIGRATION_SQL }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.warn("[migration] Could not run via RPC:", txt);
      } else {
        console.log("[migration] nutrition_preferences column added via RPC.");
      }
    } else {
      console.log("[migration] nutrition_preferences column added successfully.");
    }
  } catch (e: any) {
    console.warn("[migration] Auto-migration failed:", e.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON bodies
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Manual migration endpoint — POST /api/run-migration with { serviceRoleKey }
  app.post("/api/run-migration", async (req, res) => {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = req.body?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return res.status(400).json({ error: "Supabase URL ou SUPABASE_SERVICE_ROLE_KEY não configurados." });
    }
    try {
      // Use Supabase Management API to execute raw SQL
      const projectRef = url.replace("https://", "").split(".")[0];
      const mgmtResp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: MIGRATION_SQL }),
      });

      if (!mgmtResp.ok) {
        const errText = await mgmtResp.text();
        // Try direct RPC as fallback
        const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { error } = await (admin as any).from("profiles").select("nutrition_preferences").limit(1);
        if (!error) {
          return res.json({ success: true, message: "Coluna já existe ou foi adicionada com sucesso." });
        }
        return res.status(500).json({ error: `Migration falhou: ${errText}` });
      }

      res.json({ success: true, message: "Coluna nutrition_preferences adicionada com sucesso!" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, customerEmail, userId } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/settings`,
        customer_email: customerEmail,
        metadata: { userId },
      });

      res.json({ id: session.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Webhook
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event (e.g., checkout.session.completed)
    // In a real app, you'd update Firestore here
    console.log('Stripe Event:', event.type);

    res.json({ received: true });
  });

  // AI Meal Plan Generation endpoint
  app.post("/api/generate-meal-plan", async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
    }

    const { calories, protein, carbs, fat, preferences } = req.body;
    if (!calories) return res.status(400).json({ error: "calories é obrigatório" });

    const mealsCount = Number(preferences?.mealsPerDay ?? 5);
    const budget = preferences?.budget ?? 'Moderado';
    const restrictions = preferences?.restrictions ?? 'Nenhuma';
    const restrictionsOther = preferences?.restrictionsOther ?? '';
    const liked = preferences?.likedFoods?.trim() || 'sem preferências específicas';
    const disliked = preferences?.dislikedFoods?.trim() || 'nenhum';
    const restrictionText = restrictions === 'Outro' && restrictionsOther
      ? `Outro: ${restrictionsOther}` : restrictions;

    const mealSlots: { name: string; time: string; icon: string }[] = [
      { name: "Café da Manhã",   time: "07:00", icon: "☀️" },
      { name: "Lanche da Manhã", time: "10:00", icon: "🍎" },
      { name: "Almoço",          time: "13:00", icon: "🍽️" },
      { name: "Lanche da Tarde", time: "16:00", icon: "🥤" },
      { name: "Jantar",          time: "19:30", icon: "🌙" },
      { name: "Ceia",            time: "22:00", icon: "🌛" },
    ].slice(0, mealsCount);

    const slotsJson = JSON.stringify(mealSlots.map(s => ({ ...s, items: [] })));

    const prompt = `Você é um nutricionista esportivo. Preencha os itens de cada refeição abaixo com alimentos reais.

METAS DO USUÁRIO:
- Calorias: ${calories} kcal/dia | Proteínas: ${protein}g | Carboidratos: ${carbs}g | Gorduras: ${fat}g
- Orçamento: ${budget}
- Restrições: ${restrictionText}
- Prefere: ${liked}
- NUNCA usar: ${disliked}

ESTRUTURA BASE (preencha apenas o campo "items" de cada refeição):
${slotsJson}

REGRAS:
- Cada refeição: 2 a 3 alimentos
- quantity em gramas (ex: "150g") ou ml (ex: "200ml")
- calories, protein, carbs, fat são números inteiros
- A soma de calories de todas as refeições deve ser ~${calories} kcal
- NUNCA usar alimentos da lista "NUNCA usar"
- Respeite as restrições alimentares
- Adapte ao orçamento: Econômico=básico, Moderado=equilibrado, Premium=premium

Retorne SOMENTE o JSON completo sem markdown, sem texto extra, no formato:
{"meals":[{"name":"...","time":"...","icon":"...","items":[{"name":"...","quantity":"...","calories":0,"protein":0,"carbs":0,"fat":0}]}]}`;

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "Você responde APENAS com JSON válido e minificado. Sem markdown, sem texto, sem comentários. Apenas o objeto JSON.",
        messages: [{ role: "user", content: prompt }]
      });

      const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      console.log("[generate-meal-plan] raw response length:", raw.length, "stop_reason:", response.stop_reason);

      // Strip markdown fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[generate-meal-plan] No JSON found in response:", raw.slice(0, 300));
        return res.status(500).json({ error: "A IA não retornou um JSON válido. Tente novamente." });
      }

      let data: any;
      try {
        data = JSON.parse(jsonMatch[0]);
      } catch (parseErr: any) {
        console.error("[generate-meal-plan] JSON parse error:", parseErr.message, "\nRaw:", raw.slice(0, 300));
        return res.status(500).json({ error: "Erro ao processar resposta da IA. Tente novamente." });
      }

      if (!data.meals || !Array.isArray(data.meals)) {
        return res.status(500).json({ error: "Formato de resposta inesperado. Tente novamente." });
      }

      return res.json(data);
    } catch (error: any) {
      console.error("[generate-meal-plan] error:", error.message);
      return res.status(500).json({ error: error.message || "Erro ao gerar plano alimentar" });
    }
  });

  // AI Food Analysis endpoint
  app.post("/api/analyze-food", async (req, res) => {
    const { food, quantity } = req.body;
    if (!food || !quantity) {
      return res.status(400).json({ error: "food e quantity são obrigatórios" });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
    }
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: `Analise o valor nutricional de: ${quantity}g (ou ml) de "${food}".

Retorne APENAS um JSON válido, sem markdown, sem texto extra, com exatamente estas chaves:
{"nome":"${food}","quantidade":${quantity},"calorias":0,"proteinas_g":0,"carboidratos_g":0,"gorduras_g":0,"proteinas_pct":0,"carboidratos_pct":0,"gorduras_pct":0}

Use valores reais e precisos para ${quantity}g de ${food}. Apenas o JSON, nada mais.`
        }]
      });

      const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");
      const data = JSON.parse(jsonMatch[0]);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao analisar alimento" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    runMigrations();
  });
}

startServer();
