import type { IncomingMessage, ServerResponse } from 'node:http';

function json(res: ServerResponse, status: number, data: object) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  return json(res, 410, {
    error: 'Webhook antigo removido. Configure a AbacatePay em /api/payment-webhook no servidor Express da DigitalOcean.',
  });
}
