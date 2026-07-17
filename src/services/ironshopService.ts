import { supabase } from '../lib/supabaseClient';
import { IronShopAccessState, IronShopAuditEntry, IronShopProduct, IronShopSettings } from '../types';

const LOCKED_ACCESS: IronShopAccessState = {
  enabled: false,
  mode: 'blocked',
  hasAccess: false,
  reason: 'blocked',
  message: 'A IronShop está chegando!',
};

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Não foi possível concluir a operação.');
  }
  return payload as T;
}

export const ironshopService = {
  getAccess: async (): Promise<IronShopAccessState> => {
    const headers = await getAuthHeaders();
    if (!headers) return { ...LOCKED_ACCESS, reason: 'unauthenticated' };

    try {
      const response = await fetch('/api/ironshop/access', { headers });
      return readJson<IronShopAccessState>(response);
    } catch (error) {
      console.warn('IronShop access check failed:', error);
      return LOCKED_ACCESS;
    }
  },

  getProducts: async (): Promise<IronShopProduct[]> => {
    const headers = await getAuthHeaders();
    if (!headers) return [];
    const response = await fetch('/api/ironshop/products', { headers });
    const payload = await readJson<{ products: IronShopProduct[] }>(response);
    return payload.products;
  },

  getAdminSettings: async (): Promise<{ settings: IronShopSettings; audit: IronShopAuditEntry[] }> => {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('Sessão administrativa ausente.');
    const response = await fetch('/api/admin/ironshop/settings', { headers });
    return readJson<{ settings: IronShopSettings; audit: IronShopAuditEntry[] }>(response);
  },

  updateAdminSettings: async (settings: Partial<IronShopSettings>, reason: string) => {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('Sessão administrativa ausente.');
    const response = await fetch('/api/admin/ironshop/settings', {
      method: 'POST',
      headers,
      body: JSON.stringify({ settings, reason }),
    });
    return readJson<{ settings: IronShopSettings; audit: IronShopAuditEntry[] }>(response);
  },
};
