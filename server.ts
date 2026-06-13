import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  ABACATEPAY_API_URL,
  DEFAULT_ABACATEPAY_SIGNATURE_KEY,
  buildExternalId,
  extractWebhookMetadata,
  getCheckoutConfig,
  isActivationEvent,
  isCancellationEvent,
  isPaidPlan,
  shouldUseStaticCheckout,
  validateCreatePaymentBody,
  verifyAbacateSignature,
  type PaidPlan,
} from "./src/server/payment";

const MIGRATION_SQL = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_preferences jsonb DEFAULT NULL;`;
const ADMIN_EMAIL = "carlosalbertojuniorourak@gmail.com";
const SUPABASE_PROJECT_URL = process.env.VITE_SUPABASE_URL || "https://olelsxjkoktjabyfgtoo.supabase.co";
const SUPABASE_PUBLIC_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Kah8D1eadG41rgfXhnztIQ_s4qc2ax9";

function getPlanValue(plan: string) {
  if (plan === "Pro") return 19.9;
  if (plan === "Elite") return 29.9;
  return 0;
}

async function sendGoogleAnalyticsEvent({
  clientId,
  userId,
  name,
  params,
}: {
  clientId?: string | null;
  userId?: string | null;
  name: string;
  params?: Record<string, unknown>;
}) {
  const measurementId = process.env.VITE_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;
  if (!measurementId || !apiSecret || !clientId) return;

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          user_id: userId || undefined,
          events: [{ name, params }],
        }),
      },
    );
    if (!response.ok) {
      console.warn("[ga4] event not accepted:", name, response.status, await response.text());
    }
  } catch (error: any) {
    console.warn("[ga4] event failed:", name, error.message);
  }
}

async function updateProfilePlanFromPayment(event: any) {
  const url = SUPABASE_PROJECT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase service role não configurado.");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { customer, payment, subscription, userId, plan, referralCode, analyticsClientId } = extractWebhookMetadata(event);
  const eventName = String(event?.event || "");
  const isCancellation = isCancellationEvent(eventName);
  const isActivation = isActivationEvent(eventName);

  if (!isCancellation && (!isActivation || !isPaidPlan(String(plan)))) {
    console.log("[abacatepay] Ignoring event:", eventName, "plan:", plan);
    return;
  }

  const updatePayload = isCancellation
    ? { plano: "free", subscriptionStatus: "canceled", updatedAt: new Date().toISOString() }
    : { plano: plan as PaidPlan, subscriptionStatus: "active", updatedAt: new Date().toISOString() };

  let updateQuery = admin.from("profiles").update(updatePayload);
  if (userId) {
    updateQuery = updateQuery.eq("id", userId);
  } else if (customer?.email) {
    updateQuery = updateQuery.eq("email", customer.email);
  } else {
    throw new Error("Webhook sem userId ou email para localizar o perfil.");
  }

  const { error } = await updateQuery;
  if (error) throw error;

  if (isActivation && isPaidPlan(String(plan))) {
    const value = ((payment?.paidAmount || payment?.amount || subscription?.amount || 0) as number) / 100 || getPlanValue(String(plan));
    await sendGoogleAnalyticsEvent({
      clientId: analyticsClientId,
      userId,
      name: "purchase",
      params: {
        transaction_id: payment?.id || subscription?.id || event?.id || `${userId || customer?.email || "unknown"}-${Date.now()}`,
        currency: "BRL",
        value,
        affiliation: "AbacatePay",
        plan,
        items: [
          {
            item_id: String(plan).toLowerCase(),
            item_name: `IronShape ${plan}`,
            item_category: "subscription",
            price: value,
            quantity: 1,
          },
        ],
      },
    });
  }

  if (!isActivation || !referralCode || !userId || !isPaidPlan(String(plan))) return;

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id")
    .eq("codigo_afiliado", referralCode)
    .maybeSingle();

  if (!affiliate) return;

  const { data: existing } = await admin
    .from("affiliate_conversions")
    .select("id")
    .eq("affiliate_id", affiliate.id)
    .eq("user_id", userId)
    .eq("plano", plan)
    .limit(1);

  if (existing && existing.length > 0) return;

  const valorAssinatura = ((payment?.paidAmount || payment?.amount || subscription?.amount || 0) as number) / 100;
  const valorOriginal = plan === "Pro" ? 19.9 : 29.9;

  await admin.from("affiliate_conversions").insert([{
    affiliate_id: affiliate.id,
    user_id: userId,
    plano: plan,
    valor_assinatura: valorAssinatura || valorOriginal,
    valor_comissao: valorOriginal * 0.35,
    status_pagamento: "pendente",
  }]);
}

async function runMigrations() {
  const url = SUPABASE_PROJECT_URL;
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
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for JSON bodies
  app.use((req, res, next) => {
    if (req.path === "/api/payment-webhook") {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/admin/update-user-plan", async (req, res) => {
    const url = SUPABASE_PROJECT_URL;
    if (!url || !SUPABASE_PUBLIC_KEY) {
      return res.status(500).json({ error: "Configuração administrativa indisponível." });
    }

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Sessão administrativa ausente." });

    const admin = createClient(url, SUPABASE_PUBLIC_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || authData.user?.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }

    const userId = String(req.body?.userId || "").trim();
    const plan = String(req.body?.plan || "").trim();
    if (!userId) return res.status(400).json({ error: "Usuário não informado." });
    if (!["free", "Pro", "Elite"].includes(plan)) {
      return res.status(400).json({ error: "Plano inválido. Admin não pode ser concedido por esta operação." });
    }

    const { data, error } = await admin.rpc("admin_update_user_plan", {
      target_user_id: userId,
      target_plan: plan,
    });

    if (error) {
      if (error.code === "PGRST202") {
        return res.status(503).json({ error: "Atualização administrativa ainda não foi instalada no banco." });
      }
      if (error.code === "42501") return res.status(403).json({ error: error.message });
      if (error.code === "P0002") return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
    return res.json({ profile: data });
  });

  // Manual migration endpoint — POST /api/run-migration with { serviceRoleKey }
  app.post("/api/run-migration", async (req, res) => {
    const url = SUPABASE_PROJECT_URL;
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

  // AbacatePay subscription checkout
  app.post("/api/create-payment", async (req, res) => {
    const parsed = validateCreatePaymentBody(req.body);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
    const { plan, customerEmail, userId, referralCode, analyticsClientId } = parsed.value;

    const config = getCheckoutConfig(plan);

    if (shouldUseStaticCheckout(plan)) {
      return res.json({ url: config.fallbackUrl, provider: "abacatepay", mode: "static-link" });
    }

    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const externalId = buildExternalId({ userId, plan, referralCode });
      const response = await fetch(`${ABACATEPAY_API_URL}/subscriptions/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.ABACATEPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ id: config.productId, quantity: 1 }],
          externalId,
          returnUrl: `${appUrl}/settings`,
          completionUrl: `${appUrl}/dashboard?payment=success&plan=${plan}`,
          methods: ["CARD"],
          metadata: {
            userId,
            plan,
            customerEmail,
            referralCode: referralCode || null,
            analyticsClientId: analyticsClientId || null,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success || !data?.data?.url) {
        return res.status(500).json({ error: data?.error || "Erro ao criar checkout na AbacatePay." });
      }

      return res.json({ url: data.data.url, id: data.data.id, provider: "abacatepay", mode: "api" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Erro ao criar pagamento." });
    }
  });

  app.post("/api/create-checkout-session", (req, res) => {
    res.status(410).json({ error: "Checkout antigo removido. Use /api/create-payment para AbacatePay." });
  });

  // AbacatePay webhook. Configure it as:
  // https://ironshape.online/api/payment-webhook?webhookSecret=...
  app.post("/api/payment-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    if (!expectedSecret) {
      return res.status(500).json({ error: "ABACATEPAY_WEBHOOK_SECRET não configurado." });
    }
    if (req.query.webhookSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "");
    const signature = req.headers["x-webhook-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Assinatura ausente." });
    }
    const signatureKey = process.env.ABACATEPAY_WEBHOOK_SIGNATURE_KEY || DEFAULT_ABACATEPAY_SIGNATURE_KEY;
    if (!verifyAbacateSignature(rawBody, signature, signatureKey)) {
      return res.status(400).json({ error: "Assinatura inválida." });
    }

    try {
      const event = JSON.parse(rawBody || "{}");
      await updateProfilePlanFromPayment(event);
      return res.json({ received: true });
    } catch (error: any) {
      console.error("[abacatepay webhook] error:", error.message);
      return res.status(500).json({ error: error.message || "Erro ao processar webhook." });
    }
  });

  app.post("/api/webhook", (req, res) => {
    res.status(410).json({ error: "Webhook antigo removido. Use /api/payment-webhook para AbacatePay." });
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
    const { food, quantity, estimationMode, portionLabel } = req.body;
    if (!food || !quantity) {
      return res.status(400).json({ error: "food e quantity são obrigatórios" });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
    }
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const isSimpleEstimate = estimationMode === "simple";
      const prompt = isSimpleEstimate
        ? `Estime o valor nutricional de uma refeicao descrita como "${food}".

A pessoa escolheu a porcao "${portionLabel || "Normal"}". Use ${quantity}g/ml apenas como referencia de volume aproximado, nao como pesagem exata.

Retorne APENAS um JSON válido, sem markdown, sem texto extra, com exatamente estas chaves:
{"nome":"${food}","quantidade":${quantity},"calorias":0,"proteinas_g":0,"carboidratos_g":0,"gorduras_g":0,"proteinas_pct":0,"carboidratos_pct":0,"gorduras_pct":0}

Use valores realistas para uma refeicao comum com essa descricao e porcao. Apenas o JSON, nada mais.`
        : `Analise o valor nutricional de: ${quantity}g (ou ml) de "${food}".

Retorne APENAS um JSON válido, sem markdown, sem texto extra, com exatamente estas chaves:
{"nome":"${food}","quantidade":${quantity},"calorias":0,"proteinas_g":0,"carboidratos_g":0,"gorduras_g":0,"proteinas_pct":0,"carboidratos_pct":0,"gorduras_pct":0}

Use valores reais e precisos para ${quantity}g de ${food}. Apenas o JSON, nada mais.`;
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: prompt
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

  app.get("/api/workoutx-gif/:id", async (req, res) => {
    const id = req.params.id;
    const workoutxKey = process.env.WORKOUTX_API_KEY || process.env.VITE_WORKOUTX_KEY;
    if (!id) return res.status(400).json({ error: "id é obrigatório" });
    if (!workoutxKey) return res.status(500).json({ error: "WORKOUTX_API_KEY não configurada" });

    try {
      const response = await fetch(`https://api.workoutxapp.com/v1/gifs/${encodeURIComponent(id)}`, {
        headers: { "X-WorkoutX-Key": workoutxKey },
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `WorkoutX GIF retornou ${response.status}` });
      }
      const contentType = response.headers.get("content-type") || "image/gif";
      const cacheControl = response.headers.get("cache-control") || "public, max-age=86400";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", cacheControl);
      const buffer = Buffer.from(await response.arrayBuffer());
      return res.send(buffer);
    } catch (error: any) {
      console.error(`[workoutx-gif] Error for "${id}":`, error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Workout media proxy — WorkoutX first, RapidAPI/AscendAPI as legacy fallback.
  app.get("/api/workout-gif", async (req, res) => {
    const name = req.query.name as string;
    if (!name) return res.status(400).json({ error: "name é obrigatório" });
    const preferredSource = String(req.query.source || "").toLowerCase();
    const preferRapidApi = preferredSource === "rapidapi" || preferredSource === "ascendapi" || preferredSource === "exercisedb";

    const workoutxKey = process.env.WORKOUTX_API_KEY || process.env.VITE_WORKOUTX_KEY;
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidHost = process.env.RAPIDAPI_HOST || "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
    const rapidHeaders = rapidApiKey
      ? {
          'x-rapidapi-host': rapidHost,
          'x-rapidapi-key': rapidApiKey,
        }
      : null;

    const pickArray = (payload: any): any[] => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.results)) return payload.results;
      if (Array.isArray(payload?.exercises)) return payload.exercises;
      if (Array.isArray(payload?.items)) return payload.items;
      if (payload?.data && Array.isArray(payload.data?.exercises)) return payload.data.exercises;
      return [];
    };

    const pickMedia = (item: any): string | null => {
      const direct = [
        item?.gifUrl,
        item?.gif_url,
        item?.gif,
        item?.videoUrl,
        item?.video_url,
        item?.video,
        item?.imageUrl,
        item?.image_url,
        item?.image,
        item?.thumbnail,
      ].find(Boolean);
      if (typeof direct === "string") return direct;
      const media = item?.media || item?.assets || {};
      const nested = [media?.gifUrl, media?.gif, media?.videoUrl, media?.video, media?.imageUrl, media?.image].find(Boolean);
      if (typeof nested === "string") return nested;
      const images = item?.images || media?.images;
      if (Array.isArray(images)) {
        const first = images.find((img: any) => typeof img === "string" || img?.url || img?.src);
        if (typeof first === "string") return first;
        if (first?.url) return first.url;
        if (first?.src) return first.src;
      }
      const videos = item?.videos || media?.videos;
      if (Array.isArray(videos)) {
        const first = videos.find((vid: any) => typeof vid === "string" || vid?.url || vid?.src);
        if (typeof first === "string") return first;
        if (first?.url) return first.url;
        if (first?.src) return first.src;
      }
      return null;
    };

    const toArray = (value: any): string[] => {
      if (Array.isArray(value)) return value.map((item) => String(item));
      if (value) return [String(value)];
      return [];
    };

    const normalizeMediaResult = (item: any) => {
      const id = item?.id || item?.exerciseId;
      const rawGifUrl = item?.gifUrl || pickMedia(item);
      const workoutxGifUrl = id && typeof rawGifUrl === "string" && rawGifUrl.includes("api.workoutxapp.com")
        ? `/api/workoutx-gif/${encodeURIComponent(String(id))}`
        : rawGifUrl;
      return {
        ...item,
        id,
        exerciseId: item?.exerciseId || id,
        name: item?.name || item?.exerciseName || item?.title,
        bodyParts: toArray(item?.bodyParts || item?.bodyPart),
        targetMuscles: toArray(item?.targetMuscles || item?.target),
        equipments: toArray(item?.equipments || item?.equipment),
        gifUrl: workoutxGifUrl,
        imageUrl: item?.imageUrl || item?.image_url || item?.image || workoutxGifUrl,
        videoUrl: item?.videoUrl || item?.video_url || item?.video,
      };
    };

    const fetchExerciseDetail = async (item: any) => {
      if (!rapidHost.includes("ascendapi") || !item?.exerciseId) return item;
      try {
        const url = `https://${rapidHost}/api/v1/exercises/${encodeURIComponent(item.exerciseId)}`;
        const response = await fetch(url, { headers: rapidHeaders });
        if (!response.ok) return item;
        const payload = await response.json();
        return { ...item, ...(payload?.data || payload) };
      } catch (error: any) {
        console.warn(`[workout-gif] Detail fetch failed for ${item.exerciseId}:`, error?.message);
        return item;
      }
    };

    const normalizeSearchText = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    const scoreResult = (item: any, searchName: string) => {
      const itemName = normalizeSearchText(String(item?.name || ""));
      const query = normalizeSearchText(searchName);
      const bodyParts = (item?.bodyParts || []).map((part: string) => normalizeSearchText(String(part)));
      const targetMuscles = (item?.targetMuscles || []).map((muscle: string) => normalizeSearchText(String(muscle)));
      const itemContext = [itemName, ...bodyParts, ...targetMuscles].join(" ");
      const words = query.split(" ").filter(word => word.length > 2);
      const isChestQuery = query.includes("chest") || query.includes("bench") || query.includes("fly");
      const isShoulderQuery = query.includes("shoulder") || query.includes("lateral raise");
      const isBackQuery = query.includes("row") || query.includes("pulldown") || query.includes("pull up") || query.includes("back");
      const isLegQuery = query.includes("squat") || query.includes("leg") || query.includes("lunge") || query.includes("deadlift");
      let score = 0;
      if (itemName === query) score += 100;
      if (itemName.includes(query)) score += 60;
      for (const word of words) {
        if (itemName.includes(word)) score += 12;
      }
      if (pickMedia(item)) score += 8;
      if (itemContext.includes("neck") && !query.includes("neck")) score -= 35;
      if (itemContext.includes("calf") && !query.includes("calf")) score -= 25;
      if ((itemName.includes("reverse") || itemName.includes("rear") || itemName.includes("bent over")) && !query.includes("reverse") && !query.includes("rear")) score -= 45;

      if (isChestQuery && bodyParts.some((part: string) => part.includes("chest"))) score += 30;
      if (isChestQuery && targetMuscles.some((muscle: string) => muscle.includes("pectoral"))) score += 30;
      if (isChestQuery && itemName.includes("fly")) score += 20;
      if (isChestQuery && !/(chest|pectoral|fly)/.test(itemContext)) score -= 60;
      if (isChestQuery && /(deadlift|row|curl|calf|hip|thigh|leg|squat|hamstring|waist|back|full body)/.test(itemContext)) score -= 70;
      if (isChestQuery && !query.includes("one arm") && /(one arm|single arm|unilateral)/.test(itemContext)) score -= 80;
      if (isChestQuery && !query.includes("incline") && itemContext.includes("incline")) score -= 45;
      if (isChestQuery && !query.includes("decline") && itemContext.includes("decline")) score -= 45;
      if (isChestQuery && !query.includes("hammer") && itemContext.includes("hammer")) score -= 35;

      if (isShoulderQuery && /(chest|pectoral|hip|thigh|leg|calf|waist)/.test(itemContext)) score -= 45;
      if (isBackQuery && /(chest|pectoral|calf|neck)/.test(itemContext)) score -= 40;
      if (isLegQuery && /(chest|pectoral|neck)/.test(itemContext)) score -= 40;
      return score;
    };

    const searchWorkoutX = async (searchName: string) => {
      if (!workoutxKey) return null;
      const exactWorkoutXIds: Record<string, { id: string; name: string; bodyPart: string; equipment: string; target: string }> = {
        "dumbbell bench press": { id: "0289", name: "Dumbbell Bench Press", bodyPart: "Chest", equipment: "Dumbbell", target: "Pectorals" },
        "dumbbell fly": { id: "0308", name: "Dumbbell Fly", bodyPart: "Chest", equipment: "Dumbbell", target: "Pectorals" },
        "barbell bench press": { id: "0025", name: "Barbell Bench Press", bodyPart: "Chest", equipment: "Barbell", target: "Pectorals" },
        "push up": { id: "0662", name: "Push Up", bodyPart: "Chest", equipment: "Body Weight", target: "Pectorals" },
        "knee push up": { id: "3211", name: "Knee Push Up", bodyPart: "Chest", equipment: "Body Weight", target: "Pectorals" },
      };
      const exactMatch = exactWorkoutXIds[normalizeSearchText(searchName)];
      if (exactMatch) {
        const item = normalizeMediaResult({
          ...exactMatch,
          bodyParts: [exactMatch.bodyPart],
          equipments: [exactMatch.equipment],
          targetMuscles: [exactMatch.target],
          gifUrl: `/api/workoutx-gif/${exactMatch.id}`,
        });
        return { status: 200, data: [{ ...item, provider: "workoutx", matchScore: 999 }] };
      }
      const urls = [
        `https://api.workoutxapp.com/v1/exercises/name/${encodeURIComponent(searchName)}`,
        `https://api.workoutxapp.com/v1/exercises/search?name=${encodeURIComponent(searchName)}`,
        `https://api.workoutxapp.com/v1/exercises/search?q=${encodeURIComponent(searchName)}`,
      ];
      for (const url of urls) {
        console.log(`[workout-gif] Searching WorkoutX for: "${searchName}"`);
        const response = await fetch(url, { headers: { "X-WorkoutX-Key": workoutxKey } });
        if (response.status === 404) continue;
        const data = await response.json();
        const list = pickArray(data)
          .map(normalizeMediaResult)
          .map((item: any) => ({ ...item, provider: "workoutx", matchScore: scoreResult(item, searchName) }))
          .sort((a, b) => b.matchScore - a.matchScore);
        const safeList = list.filter((item: any) => item.matchScore >= 35 && (item.gifUrl || item.videoUrl || item.imageUrl));
        console.log(`[workout-gif] WorkoutX status: ${response.status}, Results: ${list.length}, Safe: ${safeList.length}`);
        if (response.ok && safeList.length > 0) return { status: response.status, data: safeList.slice(0, 5) };
        if (!response.ok) break;
      }
      return null;
    };

    const searchRapidApi = async (searchName: string) => {
      if (!rapidHeaders) return null;
      const url = rapidHost.includes("ascendapi")
        ? `https://${rapidHost}/api/v1/exercises/search?search=${encodeURIComponent(searchName)}`
        : `https://${rapidHost}/exercises/name/${encodeURIComponent(searchName)}?limit=5&offset=0`;
      console.log(`[workout-gif] Searching ${rapidHost} for: "${searchName}"`);
      const response = await fetch(url, { headers: rapidHeaders });
      const data = await response.json();
      const listBase = pickArray(data).map(normalizeMediaResult);
      const detailLimit = rapidHost.includes("ascendapi") ? 8 : 5;
      const list = (await Promise.all(listBase.slice(0, detailLimit).map(fetchExerciseDetail)))
        .map(normalizeMediaResult)
        .map((item: any) => ({ ...item, provider: "rapidapi", matchScore: scoreResult(item, searchName) }))
        .sort((a, b) => b.matchScore - a.matchScore);
      const safeList = list.filter((item: any) => item.matchScore >= 35);
      console.log(`[workout-gif] Status: ${response.status}, Results: ${list.length}, Safe: ${safeList.length}`);
      if (response.ok && safeList.length > 0) return { status: response.status, data: safeList.slice(0, 5) };
      return null;
    };

    const fallbackQueries: Record<string, string[]> = {
      "dumbbell chest fly": ["dumbbell fly"],
      "dumbbell lying fly": ["dumbbell fly"],
      "dumbbell flat fly": ["dumbbell fly"],
      "cable seated row": ["seated row", "lever seated row", "barbell bent over row", "dumbbell bent over row", "row"],
      "superman": ["superman", "back extension", "hyperextension"],
      "cable straight arm pulldown": ["straight arm pulldown", "cable pulldown", "lat pulldown", "pulldown"],
      "chair squat": ["bodyweight squat", "squat"],
      "wall push up": ["push up", "knee push up"],
      "incline push up": ["push up", "knee push up"],
      "glute bridge": ["glute bridge", "hip thrust"],
      "dead bug": ["dead bug", "crunch"],
      "incline plank": ["plank"],
      "side plank": ["side plank", "plank"],
      "resistance band row": ["seated row", "barbell bent over row", "dumbbell bent over row", "row"],
      "cat cow stretch": ["cat camel", "bird dog", "superman"],
      "thoracic rotation": ["open book stretch", "side lying rotation", "superman"],
      "shoulder circles": ["shoulder mobility", "arm circles", "shoulder press"],
      "wall slide": ["shoulder mobility", "scapular wall slide", "shoulder press"],
      "neck stretch": ["neck side stretch", "side neck stretch"],
      "neck side stretch": ["side neck stretch", "neck stretch"],
      "hip mobility": ["hip flexor stretch", "glute bridge", "bodyweight squat"],
      "standing hip circles": ["hip mobility", "glute bridge", "bodyweight squat"],
      "ankle mobility": ["calf stretch", "bodyweight squat"],
      "diaphragmatic breathing": ["dead bug", "crunch"],
      "pelvic tilt": ["glute bridge", "dead bug"],
      "knee to chest stretch": ["hamstring stretch", "glute stretch", "child pose"],
      "hamstring stretch": ["seated single leg hamstring stretch", "hamstring"],
      "quad stretch": ["quadriceps stretch", "bodyweight squat"],
      "glute stretch": ["glute bridge", "hip thrust"],
      "cross body shoulder stretch": ["shoulder stretch", "shoulder press"],
      "triceps stretch": ["overhead triceps stretch", "bodyweight triceps extension", "cable triceps pushdown", "triceps pushdown"],
      "chest stretch": ["doorway chest stretch", "standing chest stretch", "push up"],
      "child pose": ["kneeling push up to child pose", "child pose"],
      "spinal twist stretch": ["russian twist", "side plank"],
    };

    try {
      if (!workoutxKey && !rapidHeaders) {
        return res.status(500).json({ error: "WORKOUTX_API_KEY não configurada" });
      }

      const normalized = name.toLowerCase().trim();
      const queryAliases: Record<string, string> = {
        "wall push up": "incline push up",
        "wall pushup": "incline push up",
        "wall push-up": "incline push up",
        "standing wall push up": "incline push up",
      };
      const primaryQuery = queryAliases[normalized] || name;
      const candidates = [
        primaryQuery,
        ...(fallbackQueries[normalized] || []),
      ].filter((query, index, arr) => query && arr.indexOf(query) === index);

      let result: Awaited<ReturnType<typeof searchRapidApi>> = null;
      for (const query of candidates) {
        if (preferRapidApi) {
          result = await searchRapidApi(query);
          if (result) break;
          result = await searchWorkoutX(query);
          if (result) break;
        } else {
          result = await searchWorkoutX(query);
          if (result) break;
          result = await searchRapidApi(query);
          if (result) break;
        }
      }

      if (result) return res.status(result.status).json(result.data);
      return res.json([]);
    } catch (error: any) {
      console.error(`[workout-gif] Error for "${name}":`, error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Iron Coach chat endpoint
  app.post("/api/iron-coach", async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
    }
    const { systemPrompt, messages } = req.body;
    if (!systemPrompt || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "systemPrompt e messages são obrigatórios" });
    }
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: process.env.IRON_COACH_MODEL || "claude-haiku-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      const block = response.content[0];
      if (block.type !== "text") {
        return res.status(500).json({ error: "Resposta inesperada da IA" });
      }
      return res.json({ text: block.text });
    } catch (error: any) {
      console.error("[iron-coach] error:", error.message);
      return res.status(500).json({ error: error.message || "Erro ao conectar com o Iron Coach" });
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
