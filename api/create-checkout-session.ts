import type { IncomingMessage, ServerResponse } from 'node:http';
import Stripe from 'stripe';

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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') return json(res, 200, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(res, 500, { error: 'STRIPE_SECRET_KEY não configurada' });
  }

  let body: any;
  try { body = await readBody(req); }
  catch { return json(res, 400, { error: 'Body inválido' }); }

  const { priceId, customerEmail, userId } = body;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings`,
      customer_email: customerEmail,
      metadata: { userId },
    });
    return json(res, 200, { id: session.id });
  } catch (e: any) {
    return json(res, 500, { error: e.message });
  }
}
