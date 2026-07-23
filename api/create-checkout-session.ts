import type { IncomingMessage, ServerResponse } from 'node:http';

type PaidPlan = 'Pro' | 'Elite';

const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2';
const PLAN_CONFIG: Record<PaidPlan, { productEnv: string; fallbackUrlEnv: string; defaultUrl: string }> = {
  Pro: {
    productEnv: 'ABACATEPAY_PRODUCT_PRO_ID',
    fallbackUrlEnv: 'ABACATEPAY_CHECKOUT_PRO_URL',
    defaultUrl: 'https://buy.stripe.com/eVq3cv43n0dp1kj3Aefw400',
  },
  Elite: {
    productEnv: 'ABACATEPAY_PRODUCT_ELITE_ID',
    fallbackUrlEnv: 'ABACATEPAY_CHECKOUT_ELITE_URL',
    defaultUrl: 'https://buy.stripe.com/cNi3cv9nHe4f8MLc6Kfw401',
  },
};

function json(res: ServerResponse, status: number, data: object) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function isPaidPlan(plan: string): plan is PaidPlan {
  return plan === 'Pro' || plan === 'Elite';
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') return json(res, 200, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  let body: any;
  try { body = await readBody(req); }
  catch { return json(res, 400, { error: 'Body inválido' }); }

  const { plan, customerEmail, userId, referralCode } = body;
  if (!isPaidPlan(plan)) return json(res, 400, { error: 'Plano inválido para pagamento.' });

  const config = PLAN_CONFIG[plan];
  const productId = process.env[config.productEnv];
  const fallbackUrl = process.env[config.fallbackUrlEnv] || config.defaultUrl;

  if (!process.env.ABACATEPAY_API_KEY || !productId) {
    return json(res, 200, { url: fallbackUrl, provider: 'abacatepay', mode: 'static-link' });
  }

  try {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const externalId = `ironshape:${userId}:${plan}:${referralCode || 'no-ref'}:${Date.now()}`;
    const response = await fetch(`${ABACATEPAY_API_URL}/subscriptions/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ id: productId, quantity: 1 }],
        externalId,
        returnUrl: `${appUrl}/settings`,
        completionUrl: `${appUrl}/dashboard?payment=success&plan=${plan}`,
        methods: ['CARD'],
        metadata: { userId, plan, customerEmail, referralCode: referralCode || null },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data?.success || !data?.data?.url) {
      return json(res, 500, { error: data?.error || 'Erro ao criar checkout na AbacatePay.' });
    }
    return json(res, 200, { url: data.data.url, id: data.data.id, provider: 'abacatepay', mode: 'api' });
  } catch (e: any) {
    return json(res, 500, { error: e.message || 'Erro ao criar pagamento.' });
  }
}
