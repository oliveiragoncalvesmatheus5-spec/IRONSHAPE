import type { IncomingMessage, ServerResponse } from 'node:http';

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

const MIGRATION_SQL = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_preferences jsonb DEFAULT NULL;`;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') return json(res, 200, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const url = process.env.VITE_SUPABASE_URL;
  let body: any = {};
  try { body = await readBody(req); } catch { /* ignore */ }

  const serviceKey = body?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return json(res, 400, { error: 'VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.' });
  }

  try {
    const projectRef = url.replace('https://', '').split('.')[0];
    const mgmtResp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });

    if (!mgmtResp.ok) {
      const errText = await mgmtResp.text();
      return json(res, 500, { error: `Migration falhou: ${errText}` });
    }

    return json(res, 200, { success: true, message: 'Coluna nutrition_preferences adicionada com sucesso!' });
  } catch (e: any) {
    return json(res, 500, { error: e.message });
  }
}
