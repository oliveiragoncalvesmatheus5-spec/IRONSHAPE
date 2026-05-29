import crypto from 'node:crypto';

export const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2';

export const DEFAULT_ABACATEPAY_SIGNATURE_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';

export type PaidPlan = 'Pro' | 'Elite';

export const PLAN_CONFIG: Record<PaidPlan, { productEnv: string; fallbackUrlEnv: string; defaultUrl: string }> = {
  Pro: {
    productEnv: 'ABACATEPAY_PRODUCT_PRO_ID',
    fallbackUrlEnv: 'ABACATEPAY_CHECKOUT_PRO_URL',
    defaultUrl: 'https://app.abacatepay.com/pay/bill_qcpZwfDkagE0js0dcQrLWTjq',
  },
  Elite: {
    productEnv: 'ABACATEPAY_PRODUCT_ELITE_ID',
    fallbackUrlEnv: 'ABACATEPAY_CHECKOUT_ELITE_URL',
    defaultUrl: 'https://app.abacatepay.com/pay/bill_0mR4kgjeGnp5du3QSD5naMCU',
  },
};

export type CreatePaymentBody = {
  plan: PaidPlan;
  customerEmail?: string;
  userId: string;
  referralCode?: string | null;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function isPaidPlan(plan: unknown): plan is PaidPlan {
  return plan === 'Pro' || plan === 'Elite';
}

function isEmailLike(value: unknown) {
  if (typeof value !== 'string' || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isSafeOptionalCode(value: unknown) {
  if (value === undefined || value === null || value === '') return true;
  return typeof value === 'string' && value.length <= 80 && /^[a-zA-Z0-9._-]+$/.test(value);
}

export function validateCreatePaymentBody(body: any): ValidationResult<CreatePaymentBody> {
  if (!isPaidPlan(body?.plan)) {
    return { ok: false, error: 'Plano inválido para pagamento.' };
  }
  if (typeof body?.userId !== 'string' || body.userId.trim().length < 6 || body.userId.length > 120) {
    return { ok: false, error: 'userId é obrigatório para criar pagamento.' };
  }
  if (body.customerEmail !== undefined && body.customerEmail !== null && body.customerEmail !== '' && !isEmailLike(body.customerEmail)) {
    return { ok: false, error: 'Email do cliente inválido.' };
  }
  if (!isSafeOptionalCode(body.referralCode)) {
    return { ok: false, error: 'Código de indicação inválido.' };
  }

  return {
    ok: true,
    value: {
      plan: body.plan,
      userId: body.userId.trim(),
      customerEmail: body.customerEmail || undefined,
      referralCode: body.referralCode || null,
    },
  };
}

export function getCheckoutConfig(plan: PaidPlan, env: NodeJS.ProcessEnv = process.env) {
  const config = PLAN_CONFIG[plan];
  return {
    ...config,
    productId: env[config.productEnv],
    fallbackUrl: env[config.fallbackUrlEnv] || config.defaultUrl,
  };
}

export function shouldUseStaticCheckout(plan: PaidPlan, env: NodeJS.ProcessEnv = process.env) {
  const config = getCheckoutConfig(plan, env);
  return !env.ABACATEPAY_API_KEY || !config.productId;
}

export function buildExternalId({
  userId,
  plan,
  referralCode,
  now = Date.now(),
}: {
  userId: string;
  plan: PaidPlan;
  referralCode?: string | null;
  now?: number;
}) {
  return `ironshape:${userId}:${plan}:${referralCode || 'no-ref'}:${now}`;
}

export function signAbacatePayload(rawBody: string, signatureKey: string) {
  return crypto
    .createHmac('sha256', signatureKey)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64');
}

export function verifyAbacateSignature(rawBody: string, signatureFromHeader: string | string[] | undefined, signatureKey: string) {
  const signature = Array.isArray(signatureFromHeader) ? signatureFromHeader[0] : signatureFromHeader;
  if (!signature || !signatureKey) return false;
  const expectedSig = signAbacatePayload(rawBody, signatureKey);
  const expected = Buffer.from(expectedSig);
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function extractWebhookMetadata(event: any, env: NodeJS.ProcessEnv = process.env) {
  const data = event?.data || {};
  const checkout = data.checkout || data.billing || data.payment || {};
  const metadata = checkout.metadata || data.metadata || {};
  const externalId = checkout.externalId || data.payment?.externalId || data.subscription?.externalId || '';
  const [, externalUserId, externalPlan, externalRef] = String(externalId).split(':');
  const itemId = checkout.items?.[0]?.id;

  const planFromProduct = Object.entries(PLAN_CONFIG).find(([, cfg]) => env[cfg.productEnv] === itemId)?.[0];
  const plan = metadata.plan || externalPlan || planFromProduct;
  const userId = metadata.userId || externalUserId;
  const referralCode = metadata.referralCode || externalRef;

  return {
    checkout,
    customer: data.customer,
    payment: data.payment,
    subscription: data.subscription,
    userId,
    plan,
    referralCode,
  };
}

export function isActivationEvent(eventName: string) {
  return ['checkout.completed', 'subscription.completed', 'subscription.renewed'].includes(eventName);
}

export function isCancellationEvent(eventName: string) {
  return eventName === 'subscription.cancelled';
}
