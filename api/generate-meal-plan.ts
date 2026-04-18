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

  const { calories, protein, carbs, fat, preferences } = body;
  if (!calories) return json(res, 400, { error: 'calories é obrigatório' });

  const mealsCount = Number(preferences?.mealsPerDay ?? 5);
  const budget = preferences?.budget ?? 'Moderado';
  const restrictions = preferences?.restrictions ?? 'Nenhuma';
  const restrictionsOther = preferences?.restrictionsOther ?? '';
  const liked = preferences?.likedFoods?.trim() || 'sem preferências específicas';
  const disliked = preferences?.dislikedFoods?.trim() || 'nenhum';
  const restrictionText = restrictions === 'Outro' && restrictionsOther
    ? `Outro: ${restrictionsOther}` : restrictions;

  const mealSlots = [
    { name: 'Café da Manhã',   time: '07:00', icon: '☀️' },
    { name: 'Lanche da Manhã', time: '10:00', icon: '🍎' },
    { name: 'Almoço',          time: '13:00', icon: '🍽️' },
    { name: 'Lanche da Tarde', time: '16:00', icon: '🥤' },
    { name: 'Jantar',          time: '19:30', icon: '🌙' },
    { name: 'Ceia',            time: '22:00', icon: '🌛' },
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
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Você responde APENAS com JSON válido e minificado. Sem markdown, sem texto, sem comentários. Apenas o objeto JSON.',
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return json(res, 500, { error: 'A IA não retornou um JSON válido. Tente novamente.' });

    let data: any;
    try { data = JSON.parse(jsonMatch[0]); }
    catch { return json(res, 500, { error: 'Erro ao processar resposta da IA. Tente novamente.' }); }

    if (!data.meals || !Array.isArray(data.meals)) {
      return json(res, 500, { error: 'Formato de resposta inesperado. Tente novamente.' });
    }

    return json(res, 200, data);
  } catch (e: any) {
    return json(res, 500, { error: e.message || 'Erro ao gerar plano alimentar' });
  }
}
