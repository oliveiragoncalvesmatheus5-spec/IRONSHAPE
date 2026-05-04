import type { IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(res, 500, { error: 'ANTHROPIC_API_KEY não configurada' });
  }

  let body: any;
  try { body = await readBody(req); }
  catch { return json(res, 400, { error: 'Body inválido' }); }

  const { systemPrompt, messages } = body;
  if (!systemPrompt || !Array.isArray(messages) || messages.length === 0) {
    return json(res, 400, { error: 'systemPrompt e messages são obrigatórios' });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });

    const block = response.content[0];
    if (block.type !== 'text') {
      return json(res, 500, { error: 'Resposta inesperada da IA' });
    }
    return json(res, 200, { text: block.text });
  } catch (e: any) {
    return json(res, 500, { error: e.message || 'Erro ao conectar com o Iron Coach' });
  }
}
