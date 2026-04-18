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

  const { food, quantity } = body;
  if (!food || !quantity) {
    return json(res, 400, { error: 'food e quantity são obrigatórios' });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Analise o valor nutricional de: ${quantity}g (ou ml) de "${food}".

Retorne APENAS um JSON válido, sem markdown, sem texto extra, com exatamente estas chaves:
{"nome":"${food}","quantidade":${quantity},"calorias":0,"proteinas_g":0,"carboidratos_g":0,"gorduras_g":0,"proteinas_pct":0,"carboidratos_pct":0,"gorduras_pct":0}

Use valores reais e precisos para ${quantity}g de ${food}. Apenas o JSON, nada mais.`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const jsonMatch = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta inválida da IA');
    return json(res, 200, JSON.parse(jsonMatch[0]));
  } catch (e: any) {
    return json(res, 500, { error: e.message || 'Erro ao analisar alimento' });
  }
}
