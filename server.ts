import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { EmailService } from "./src/services/email.service";
import {
  ABACATEPAY_API_URL,
  DEFAULT_ABACATEPAY_SIGNATURE_KEY,
  buildExternalId,
  extractWebhookMetadata,
  getCheckoutConfig,
  getPaymentDate,
  isActivationEvent,
  isCancellationEvent,
  isPaidPlan,
  shouldUseStaticCheckout,
  validateCreatePaymentBody,
  verifyAbacateSignature,
  type PaidPlan,
} from "./src/server/payment";

const BASE_MIGRATION_SQL = `
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_preferences jsonb DEFAULT NULL;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "subscriptionPaidAt" timestamptz DEFAULT NULL;
`;
const SECURITY_MIGRATION_SQL = (() => {
  try {
    return fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20260628_secure_rls_policies.sql"), "utf8");
  } catch {
    return "";
  }
})();
const MIGRATION_SQL = `${BASE_MIGRATION_SQL}\n${SECURITY_MIGRATION_SQL}`;
const ADMIN_EMAIL = "carlosalbertojuniorourak@gmail.com";
const SUPABASE_PROJECT_URL = process.env.VITE_SUPABASE_URL || "https://olelsxjkoktjabyfgtoo.supabase.co";
const SUPABASE_PUBLIC_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Kah8D1eadG41rgfXhnztIQ_s4qc2ax9";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const EXERCISE_MEDIA_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const EXERCISE_MEDIA_EMPTY_CACHE_TTL = 60 * 60 * 1000;
const exerciseMediaCache = new Map<string, { expiresAt: number; data: any[] }>();
const AI_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const aiRateLimit = new Map<string, { count: number; resetAt: number }>();
const welcomeEmailSentUsers = new Set<string>();
type IronShopAvailabilityMode = "blocked" | "admins" | "testers" | "group" | "gradual" | "all";
type IronShopSettings = {
  ironshop_enabled: boolean;
  availability_mode: IronShopAvailabilityMode;
  gradual_percentage: number;
  allowed_group: string | null;
  updated_at?: string;
  updated_by?: string | null;
};
type IronShopAuditEntry = {
  id: string;
  admin_id?: string | null;
  admin_email?: string | null;
  previous_state: IronShopSettings;
  new_state: IronShopSettings;
  reason?: string | null;
  created_at: string;
};
const ironShopAuditFallback: IronShopAuditEntry[] = [];
let ironShopSettingsFallback: IronShopSettings = {
  ironshop_enabled: process.env.IRONSHOP_ENABLED === "true",
  availability_mode: (process.env.IRONSHOP_AVAILABILITY_MODE as IronShopAvailabilityMode) || "blocked",
  gradual_percentage: Number(process.env.IRONSHOP_GRADUAL_PERCENTAGE || 0),
  allowed_group: process.env.IRONSHOP_ALLOWED_GROUP || null,
  updated_at: new Date().toISOString(),
  updated_by: null,
};

function getPlanValue(plan: string) {
  if (plan === "Pro") return 29.9;
  if (plan === "Elite") return 39.9;
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
    : {
        plano: plan as PaidPlan,
        subscriptionStatus: "active",
        subscriptionPaidAt: getPaymentDate(event),
        updatedAt: new Date().toISOString(),
      };

  if (!userId && !customer?.email) {
    throw new Error("Webhook sem userId ou email para localizar o perfil.");
  }

  const updateProfile = async (payload: typeof updatePayload, match: { id?: string; email?: string }) => {
    let query = admin
      .from("profiles")
      .update(payload)
      .select("id,email,plano,subscriptionStatus,updatedAt")
      .limit(1);
    if (match.id) query = query.eq("id", match.id);
    if (match.email) query = query.eq("email", match.email);

    const { data, error } = await query;
    if (error?.code === "42703" && !isCancellation && "subscriptionPaidAt" in payload) {
      console.warn("[abacatepay] subscriptionPaidAt column missing; retrying profile update without payment date.");
      const { subscriptionPaidAt: _subscriptionPaidAt, ...fallbackPayload } = payload;
      return updateProfile(fallbackPayload as typeof updatePayload, match);
    }
    if (error) throw error;
    return data?.[0] || null;
  };

  let updatedProfile = userId ? await updateProfile(updatePayload, { id: userId }) : null;
  if (!updatedProfile && customer?.email) {
    updatedProfile = await updateProfile(updatePayload, { email: customer.email });
  }

  if (!updatedProfile) {
    throw new Error(`Webhook não encontrou perfil para userId/email: ${userId || "sem userId"} / ${customer?.email || "sem email"}.`);
  }

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
  const valorOriginal = plan === "Pro" ? 29.9 : 39.9;

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

function getServiceAdminClient() {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function normalizeIronShopMode(value: unknown): IronShopAvailabilityMode {
  const mode = String(value || "").trim();
  if (["blocked", "admins", "testers", "group", "gradual", "all"].includes(mode)) return mode as IronShopAvailabilityMode;
  return "blocked";
}

function normalizeIronShopSettings(input: any): IronShopSettings {
  return {
    ironshop_enabled: Boolean(input?.ironshop_enabled),
    availability_mode: normalizeIronShopMode(input?.availability_mode),
    gradual_percentage: Math.min(100, Math.max(0, Number(input?.gradual_percentage || 0))),
    allowed_group: input?.allowed_group ? String(input.allowed_group) : null,
    updated_at: input?.updated_at || new Date().toISOString(),
    updated_by: input?.updated_by || null,
  };
}

async function readIronShopSettings(): Promise<IronShopSettings> {
  const admin = getServiceAdminClient();
  if (!admin) return normalizeIronShopSettings(ironShopSettingsFallback);

  const { data, error } = await admin
    .from("ironshop_settings")
    .select("*")
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    console.warn("[ironshop] settings unavailable; using fallback:", error.message);
    return normalizeIronShopSettings(ironShopSettingsFallback);
  }

  if (!data) {
    const defaultSettings = normalizeIronShopSettings(ironShopSettingsFallback);
    await admin.from("ironshop_settings").upsert([{ id: "global", ...defaultSettings }], { onConflict: "id" });
    return defaultSettings;
  }

  return normalizeIronShopSettings(data);
}

async function readIronShopAudit(): Promise<IronShopAuditEntry[]> {
  const admin = getServiceAdminClient();
  if (!admin) return ironShopAuditFallback.slice(0, 20);

  const { data, error } = await admin
    .from("ironshop_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.warn("[ironshop] audit unavailable; using fallback:", error.message);
    return ironShopAuditFallback.slice(0, 20);
  }

  return (data || []) as IronShopAuditEntry[];
}

async function hasIronShopEarlyAccess(userId: string, email?: string | null) {
  if (email === ADMIN_EMAIL) return true;

  const envAllowList = (process.env.IRONSHOP_EARLY_ACCESS_EMAILS || "")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
  if (email && envAllowList.includes(email.toLowerCase())) return true;

  const admin = getServiceAdminClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("ironshop_early_access")
    .select("user_id,email,active")
    .or(`user_id.eq.${userId},email.eq.${email || ""}`)
    .eq("active", true)
    .limit(1);

  if (error) {
    console.warn("[ironshop] early access unavailable:", error.message);
    return false;
  }

  return Boolean(data?.length);
}

function isInGradualRollout(userId: string, percentage: number) {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  const hash = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (hash % 100) < percentage;
}

async function resolveIronShopAccess(authUser: { id: string; email?: string | null }) {
  const settings = await readIronShopSettings();
  const isAdmin = authUser.email === ADMIN_EMAIL;
  if (isAdmin) {
    return {
      enabled: settings.ironshop_enabled || settings.availability_mode === "all",
      mode: settings.availability_mode,
      hasAccess: true,
      reason: "admin" as const,
      message: undefined,
    };
  }

  const earlyAccess = await hasIronShopEarlyAccess(authUser.id, authUser.email);
  const enabled = settings.ironshop_enabled || settings.availability_mode === "all";
  let hasAccess = false;
  let reason: "public" | "admin" | "early_access" | "blocked" = "blocked";

  if (enabled || settings.availability_mode === "all") {
    hasAccess = true;
    reason = "public";
  } else if (isAdmin && ["admins", "testers", "group", "gradual"].includes(settings.availability_mode)) {
    hasAccess = true;
    reason = "admin";
  } else if (earlyAccess && ["testers", "group", "gradual"].includes(settings.availability_mode)) {
    hasAccess = true;
    reason = "early_access";
  } else if (settings.availability_mode === "gradual" && isInGradualRollout(authUser.id, settings.gradual_percentage)) {
    hasAccess = true;
    reason = "early_access";
  }

  return {
    enabled,
    mode: settings.availability_mode,
    hasAccess,
    reason,
    message: hasAccess ? undefined : "A IronShop está chegando!",
  };
}

async function recordIronShopDeniedAccess(authUser: { id: string; email?: string | null }, source: string, req: express.Request) {
  const admin = getServiceAdminClient();
  const entry = {
    user_id: authUser.id,
    email: authUser.email || null,
    source,
    ip: req.ip || req.socket.remoteAddress || null,
    user_agent: req.headers["user-agent"] || null,
    created_at: new Date().toISOString(),
  };

  if (!admin) {
    console.warn("[ironshop] denied access:", entry);
    return;
  }

  const { error } = await admin.from("ironshop_access_attempts").insert([entry]);
  if (error) console.warn("[ironshop] denied access log failed:", error.message, entry);
}

const IRONSHOP_PREVIEW_PRODUCTS = [
  {
    id: "whey-performance",
    name: "Whey Performance IronShape",
    category: "supplement",
    price: 129.9,
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80",
    stock: 24,
    featured: true,
  },
  {
    id: "camiseta-dry-fit",
    name: "Camiseta Dry Fit IronShape",
    category: "apparel",
    price: 89.9,
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
    stock: 40,
    featured: true,
  },
  {
    id: "shaker-steel",
    name: "Shaker Steel 700ml",
    category: "accessory",
    price: 59.9,
    image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=900&q=80",
    stock: 18,
  },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const requireAuthenticatedUser = async (req: express.Request, res: express.Response) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      res.status(401).json({ error: "Faça login novamente para continuar." });
      return null;
    }

    try {
      const authClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false } });
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: "Sessão expirada. Entre novamente para continuar." });
        return null;
      }
      return data.user;
    } catch {
      res.status(401).json({ error: "Não foi possível validar sua sessão. Tente novamente." });
      return null;
    }
  };

  const checkAiRateLimit = (key: string, limit: number) => {
    const now = Date.now();
    const current = aiRateLimit.get(key);
    if (!current || current.resetAt <= now) {
      aiRateLimit.set(key, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  };

  const enforceAiRateLimit = (req: express.Request, res: express.Response, userId: string, action: string, limit: number) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const allowed = checkAiRateLimit(`${action}:${userId}:${ip}`, limit);
    if (!allowed) {
      res.status(429).json({ error: "Limite temporário atingido. Tente novamente mais tarde." });
      return false;
    }
    return true;
  };

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
    res.json({
      status: "ok",
      securityMigration: "20260628_secure_rls_policies",
      webhookAuth: "signature_only_20260628",
    });
  });

  app.post("/api/send-welcome-email", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;

    if (!authUser.email) {
      return res.status(400).json({ error: "Usuário sem email para receber boas-vindas." });
    }

    if (welcomeEmailSentUsers.has(authUser.id)) {
      return res.json({ ok: true, skipped: true, reason: "welcome_email_already_sent" });
    }

    try {
      const data = await EmailService.sendWelcomeEmail({
        to: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || "atleta",
        dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard`,
      });

      welcomeEmailSentUsers.add(authUser.id);
      return res.json({ ok: true, id: data?.id });
    } catch (error: any) {
      console.error("[resend] welcome email failed:", error.message);
      return res.status(500).json({ error: error.message || "Erro ao enviar email de boas-vindas." });
    }
  });

  app.get("/api/ironshop/access", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;

    try {
      const access = await resolveIronShopAccess({ id: authUser.id, email: authUser.email });
      if (!access.hasAccess) await recordIronShopDeniedAccess({ id: authUser.id, email: authUser.email }, "access-status", req);
      return res.json(access);
    } catch (error: any) {
      console.warn("[ironshop] access check failed:", error.message);
      return res.status(500).json({ error: "Não foi possível verificar a disponibilidade da loja." });
    }
  });

  app.get("/api/ironshop/products", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;

    const access = await resolveIronShopAccess({ id: authUser.id, email: authUser.email });
    if (!access.hasAccess) {
      await recordIronShopDeniedAccess({ id: authUser.id, email: authUser.email }, "products", req);
      return res.status(403).json({
        error: "A IronShop está chegando! Em breve, você poderá encontrar suplementos, roupas e acessórios selecionados para ajudar na sua evolução.",
      });
    }

    return res.json({ products: IRONSHOP_PREVIEW_PRODUCTS });
  });

  app.get("/api/admin/ironshop/settings", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;
    if (authUser.email !== ADMIN_EMAIL) return res.status(403).json({ error: "Acesso restrito ao administrador." });

    const settings = await readIronShopSettings();
    const audit = await readIronShopAudit();
    return res.json({ settings, audit });
  });

  app.post("/api/admin/ironshop/settings", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;
    if (authUser.email !== ADMIN_EMAIL) return res.status(403).json({ error: "Acesso restrito ao administrador." });

    const previous = await readIronShopSettings();
    const incoming = req.body?.settings || {};
    const next = normalizeIronShopSettings({
      ...previous,
      ...incoming,
      ironshop_enabled: Boolean(incoming.ironshop_enabled),
      updated_at: new Date().toISOString(),
      updated_by: authUser.id,
    });
    const reason = String(req.body?.reason || "").trim().slice(0, 500) || null;
    const admin = getServiceAdminClient();

    if (admin) {
      const { error } = await admin
        .from("ironshop_settings")
        .upsert([{ id: "global", ...next }], { onConflict: "id" });
      if (error) {
        console.warn("[ironshop] settings persistence failed; using fallback:", error.message);
        ironShopSettingsFallback = next;
      }

      const { error: auditError } = await admin.from("ironshop_audit_logs").insert([{
        admin_id: authUser.id,
        admin_email: authUser.email || null,
        previous_state: previous,
        new_state: next,
        reason,
      }]);
      if (auditError) console.warn("[ironshop] audit persistence failed:", auditError.message);
    } else {
      ironShopSettingsFallback = next;
    }

    ironShopAuditFallback.unshift({
      id: `fallback-${Date.now()}`,
      admin_id: authUser.id,
      admin_email: authUser.email || null,
      previous_state: previous,
      new_state: next,
      reason,
      created_at: new Date().toISOString(),
    });

    return res.json({ settings: next, audit: await readIronShopAudit() });
  });

  app.post("/api/admin/send-test-email", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;
    if (authUser.email !== ADMIN_EMAIL) return res.status(403).json({ error: "Acesso restrito ao administrador." });

    const to = String(req.body?.to || authUser.email || "").trim();
    if (!to) return res.status(400).json({ error: "Email de destino não informado." });

    try {
      const data = await EmailService.sendWelcomeEmail({
        to,
        name: authUser.user_metadata?.full_name || "Administrador",
        dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard`,
      });

      return res.json({
        ok: true,
        id: data?.id,
        to,
      });
    } catch (error: any) {
      console.error("[resend] test email failed:", error.message);
      return res.status(500).json({ error: error.message || "Erro ao enviar email de teste." });
    }
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

  app.post("/api/run-migration", (_req, res) => {
    res.status(410).json({
      error: "Migration automática removida por segurança. Execute migrations pelo Supabase Dashboard ou pipeline privado.",
    });
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
  // https://ironshape.online/api/payment-webhook
  app.post("/api/payment-webhook", express.raw({ type: "application/json" }), async (req, res) => {
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
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;
    if (!enforceAiRateLimit(req, res, authUser.id, "generate-meal-plan", 20)) return;

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
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;
    if (!enforceAiRateLimit(req, res, authUser.id, "analyze-food", 60)) return;

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

  // Exercise media proxy — WorkoutX is the single remote media provider.
  app.get("/api/workout-gif", async (req, res) => {
    const name = req.query.name as string;
    if (!name) return res.status(400).json({ error: "name é obrigatório" });
    const cacheKey = name.toLowerCase().trim();
    const cached = exerciseMediaCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("X-Exercise-Media-Cache", "HIT");
      return res.json(cached.data);
    }
    if (cached) exerciseMediaCache.delete(cacheKey);

    const workoutXKey = process.env.WORKOUTX_API_KEY;
    const workoutXBaseUrl = (process.env.WORKOUTX_BASE_URL || "https://api.workoutxapp.com/v1").replace(/\/+$/, "");
    const workoutXHeaders = workoutXKey ? { "X-WorkoutX-Key": workoutXKey } : null;

    const pickArray = (payload: any): any[] => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.results)) return payload.results;
      if (Array.isArray(payload?.exercises)) return payload.exercises;
      if (Array.isArray(payload?.items)) return payload.items;
      if (payload?.data && Array.isArray(payload.data?.exercises)) return payload.data.exercises;
      return [];
    };

    const toArray = (value: any): string[] => {
      if (Array.isArray(value)) return value.map((item) => String(item));
      if (value) return [String(value)];
      return [];
    };

    const isGifMediaUrl = (value: any) =>
      typeof value === "string" && (/\.gif(\?|$)/i.test(value) || /\/gifs\/[^/?#]+(\?|$)/i.test(value));

    const normalizeMediaResult = (item: any) => {
      const id = String(item?.id || item?.exerciseId || "").trim();
      const gifUrl = [item?.gifUrl, item?.gif_url, item?.gif].find(isGifMediaUrl) || null;
      return {
        ...item,
        id,
        exerciseId: item?.exerciseId || id,
        name: item?.name || item?.exerciseName || item?.title,
        bodyParts: toArray(item?.bodyParts || item?.bodyPart),
        targetMuscles: toArray(item?.targetMuscles || item?.target),
        equipments: toArray(item?.equipments || item?.equipment),
        bodyPart: item?.bodyPart,
        target: item?.target,
        equipment: item?.equipment,
        gifUrl,
        imageUrl: null,
        videoUrl: null,
        provider: "workoutx",
      };
    };

    const fetchExerciseDetail = async (item: any) => {
      if (!workoutXHeaders || !item?.id || item?.gifUrl) return item;
      try {
        const url = `${workoutXBaseUrl}/exercises/exercise/${encodeURIComponent(item.id)}`;
        const response = await fetch(url, { headers: workoutXHeaders });
        if (response.status === 429) {
          const error: any = new Error("Cota mensal da WorkoutX atingida.");
          error.status = 429;
          throw error;
        }
        if (!response.ok) return item;
        const payload = await response.json();
        return { ...item, ...(payload?.data || payload) };
      } catch (error: any) {
        if (error?.status === 429) throw error;
        console.warn(`[workout-gif] WorkoutX detail fetch failed for ${item.id}:`, error?.message);
        return item;
      }
    };

    const normalizeSearchText = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    const requiresExactWorkoutXMatch = (query: string) =>
      ["push up", "plank", "crunch", "squat"].includes(normalizeSearchText(query));

    const scoreResult = (item: any, searchName: string) => {
      const itemName = normalizeSearchText(String(item?.name || ""));
      const query = normalizeSearchText(searchName);
      const bodyParts = toArray(item?.bodyParts || item?.bodyPart).map((part: string) => normalizeSearchText(String(part)));
      const targetMuscles = toArray(item?.targetMuscles || item?.target).map((muscle: string) => normalizeSearchText(String(muscle)));
      const equipment = toArray(item?.equipments || item?.equipment).map((equip: string) => normalizeSearchText(String(equip)));
      const itemContext = [itemName, ...bodyParts, ...targetMuscles, ...equipment].join(" ");
      const words = query.split(" ").filter(word => word.length > 2);
      const isChestQuery = query.includes("chest") || query.includes("bench") || query.includes("fly");
      const isShoulderQuery = query.includes("shoulder") || query.includes("lateral raise");
      const isBackQuery = query.includes("row") || query.includes("pulldown") || query.includes("pull up") || query.includes("back");
      const isLegQuery = query.includes("squat") || query.includes("leg") || query.includes("lunge") || query.includes("deadlift");
      let score = 0;
      if (itemName === query) score += 100;
      if (itemName.startsWith(`${query} `)) score += 35;
      if (itemName.includes(query)) score += 60;
      for (const word of words) {
        if (itemName.includes(word)) score += 12;
      }
      if (isGifMediaUrl(item?.gifUrl)) score += 15;
      const extraWords = itemName.split(" ").filter(Boolean).length - words.length;
      if (extraWords > 0) score -= Math.min(extraWords * 8, 40);
      if (itemContext.includes("neck") && !query.includes("neck")) score -= 35;
      if (itemContext.includes("calf") && !query.includes("calf")) score -= 25;
      if (itemContext.includes("on knees") && !query.includes("knee")) score -= 70;
      if ((itemName.includes("reverse") || itemName.includes("rear") || itemName.includes("bent over")) && !query.includes("reverse") && !query.includes("rear")) score -= 45;
      if (!query.includes("incline") && itemContext.includes("incline")) score -= 35;
      if (!query.includes("decline") && itemContext.includes("decline")) score -= 35;
      if (!query.includes("depth") && itemContext.includes("depth")) score -= 35;
      if (!query.includes("jump") && /(jump|plyometric)/.test(itemContext)) score -= 40;
      if (query.includes("push up") && equipment.some((equip: string) => equip.includes("body weight"))) score += 35;
      if (query.includes("push up") && equipment.some((equip: string) => equip && !equip.includes("body weight"))) score -= 90;
      if (query.includes("push up") && /(bosu|ball|weighted|medicine|stability|suspension)/.test(itemContext)) score -= 70;
      if (query.includes("dumbbell") && equipment.some((equip: string) => equip.includes("dumbbell"))) score += 30;
      if (query.includes("dumbbell") && equipment.some((equip: string) => equip && !equip.includes("dumbbell"))) score -= 50;
      if (query.includes("barbell") && equipment.some((equip: string) => equip.includes("barbell"))) score += 30;
      if (query.includes("barbell") && equipment.some((equip: string) => equip && !equip.includes("barbell"))) score -= 50;
      if (query.includes("barbell squat") && itemName.includes("full squat")) score += 45;
      if (query.includes("barbell squat") && itemContext.includes("on knees")) score -= 110;

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
      if (!workoutXHeaders) return null;
      const url = `${workoutXBaseUrl}/exercises?name=${encodeURIComponent(searchName)}&limit=10&offset=0`;
      console.log(`[workout-gif] Searching WorkoutX for: "${searchName}"`);
      const response = await fetch(url, { headers: workoutXHeaders });
      if (response.status === 429) {
        const error: any = new Error("Cota mensal da WorkoutX atingida.");
        error.status = 429;
        throw error;
      }
      if (!response.ok) return null;
      const data = await response.json();

      const listBase = pickArray(data)
        .map(normalizeMediaResult)
        .map((item: any) => ({ ...item, matchScore: scoreResult(item, searchName) }))
        .sort((a, b) => b.matchScore - a.matchScore);
      const detailCandidates = listBase.filter((item: any) => item.matchScore >= 12).slice(0, 5);
      const list = (await Promise.all(detailCandidates.map(fetchExerciseDetail)))
        .map(normalizeMediaResult)
        .map((item: any) => ({ ...item, matchScore: scoreResult(item, searchName) }))
        .sort((a, b) => b.matchScore - a.matchScore);
      const motionList = list.filter((item: any) => item.matchScore >= 35 && isGifMediaUrl(item.gifUrl));
      const safeList = requiresExactWorkoutXMatch(searchName)
        ? motionList.filter((item: any) => normalizeSearchText(String(item.name || "")) === normalizeSearchText(searchName))
        : motionList;
      console.log(`[workout-gif] WorkoutX status: ${response.status}, Results: ${list.length}, Safe GIFs: ${safeList.length}`);
      if (safeList.length > 0) return { status: response.status, data: safeList.slice(0, 5) };
      return null;
    };

    const fallbackQueries: Record<string, string[]> = {
      "dumbbell chest fly": ["dumbbell fly"],
      "dumbbell lying fly": ["dumbbell fly"],
      "dumbbell flat fly": ["dumbbell fly"],
      "cable crossover": ["cable middle fly", "cable fly", "lever pec deck fly"],
      "cable chest fly": ["cable middle fly", "cable fly", "lever pec deck fly"],
      "cable incline fly": ["cable middle fly", "cable fly", "dumbbell incline fly"],
      "barbell squat": ["barbell full squat", "barbell high bar squat", "smith squat"],
      "squat": ["barbell full squat", "smith squat"],
      "bodyweight squat": ["full squat", "smith chair squat"],
      "body weight squat": ["full squat", "smith chair squat"],
      "cable seated row": ["seated row", "lever seated row", "barbell bent over row", "dumbbell bent over row", "row"],
      "ez bar skull crusher": ["barbell lying triceps extension", "lever triceps extension"],
      "dumbbell skull crusher": ["barbell lying triceps extension", "lever triceps extension"],
      "dumbbell triceps overhead extension": ["cable overhead triceps extension", "lever triceps extension"],
      "close grip barbell bench press": ["barbell bench press", "weighted bench dip"],
      "plate front raise": ["dumbbell front raise", "barbell front raise"],
      "ab wheel rollout": ["wheel rollout"],
      "cable crunch": ["weighted crunch", "crunch"],
      "kneeling cable crunch": ["weighted crunch", "crunch"],
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
      if (!workoutXHeaders) {
        exerciseMediaCache.set(cacheKey, {
          data: [],
          expiresAt: Date.now() + EXERCISE_MEDIA_EMPTY_CACHE_TTL,
        });
        res.setHeader("X-Exercise-Media-Provider", "workoutx-not-configured");
        return res.status(200).json([]);
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

      let result: Awaited<ReturnType<typeof searchWorkoutX>> = null;
      for (const query of candidates) {
        result = await searchWorkoutX(query);
        if (result) break;
      }

      const data = result?.data || [];
      exerciseMediaCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + (data.length > 0 ? EXERCISE_MEDIA_CACHE_TTL : EXERCISE_MEDIA_EMPTY_CACHE_TTL),
      });
      res.setHeader("X-Exercise-Media-Cache", "MISS");
      return res.status(result?.status || 200).json(data);
    } catch (error: any) {
      console.error(`[workout-gif] Error for "${name}":`, error.message);
      if (error?.status === 429) {
        exerciseMediaCache.set(cacheKey, {
          data: [],
          expiresAt: Date.now() + EXERCISE_MEDIA_EMPTY_CACHE_TTL,
        });
        res.setHeader("X-Exercise-Media-Provider", "workoutx-quota-exceeded");
        return res.status(200).json([]);
      }
      return res.status(error?.status || 500).json({ error: error.message });
    }
  });

  // Iron Coach chat endpoint
  app.post("/api/iron-coach", async (req, res) => {
    const authUser = await requireAuthenticatedUser(req, res);
    if (!authUser) return;
    if (!enforceAiRateLimit(req, res, authUser.id, "iron-coach", 60)) return;

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
