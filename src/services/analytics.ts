import type { Plan } from '../types';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-JTYEDMRSQR';
const CLIENT_ID_KEY = 'ironshape_ga_client_id';
let initialized = false;

function getOrCreateFallbackClientId() {
  try {
    const saved = localStorage.getItem(CLIENT_ID_KEY);
    if (saved) return saved;
    const id = `${Date.now()}.${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return `${Date.now()}.${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function initAnalytics() {
  if (initialized || !GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  try {
    initAnalytics();
    window.gtag?.('event', eventName, {
      app_name: 'IronShape',
      ...params,
    });
  } catch {
    // Analytics must never block app usage.
  }
}

export function trackPlanEvent(eventName: string, plan: Plan, params: Record<string, unknown> = {}) {
  trackEvent(eventName, {
    plan,
    currency: 'BRL',
    value: plan === 'Pro' ? 29.9 : plan === 'Elite' ? 39.9 : 0,
    ...params,
  });
}

export function getAnalyticsClientId(): Promise<string> {
  initAnalytics();
  return new Promise((resolve) => {
    const fallback = getOrCreateFallbackClientId();
    if (!window.gtag || !GA_MEASUREMENT_ID) return resolve(fallback);

    let settled = false;
    const finish = (value?: string) => {
      if (settled) return;
      settled = true;
      resolve(value || fallback);
    };

    window.gtag('get', GA_MEASUREMENT_ID, 'client_id', finish);
    window.setTimeout(() => finish(fallback), 700);
  });
}
