interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface StatsCache {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  ASSETS: AssetFetcher;
  SITE_STATS_CACHE: StatsCache;
  ACCESS_KEY: string;
  SECRET_KEY: string;
}

// 51.LA 后台统计 ID 对应的 SDK 掩码 ID。
const MASK_ID = '3Rj42WeI5knyYbyF';
const API_URL = 'https://v6-open.51.la/open/overview/get';
const CACHE_PREFIX = 'site-stats:';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

async function fetchSiteStats(env: Env) {
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).slice(2, 6);
  const signParams = new URLSearchParams({
    accessKey: env.ACCESS_KEY,
    nonce,
    secretKey: env.SECRET_KEY,
    timestamp,
  });
  const sortedParams = [...signParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  const sign = await sha256(new URLSearchParams(sortedParams).toString());
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      maskId: MASK_ID,
      accessKey: env.ACCESS_KEY,
      nonce,
      timestamp,
      sign,
    }),
  });

  if (!response.ok) throw new Error(`51.LA request failed: ${response.status}`);
  const result = (await response.json()) as {
    success?: boolean;
    bean?: { totalUv?: number; totalPv?: number };
  };
  if (!result.success || !result.bean) throw new Error('51.LA returned an invalid response');
  return {
    totalUv: result.bean.totalUv ?? 0,
    totalPv: result.bean.totalPv ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

async function getSiteStats(env: Env) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${CACHE_PREFIX}${today}`;
  const cached = await env.SITE_STATS_CACHE.get(key, 'json');
  if (cached) return cached;

  try {
    const stats = await fetchSiteStats(env);
    await env.SITE_STATS_CACHE.put(key, JSON.stringify(stats), { expirationTtl: 172800 });
    await env.SITE_STATS_CACHE.put(`${CACHE_PREFIX}latest`, JSON.stringify(stats));
    return stats;
  } catch (error) {
    const latest = await env.SITE_STATS_CACHE.get(`${CACHE_PREFIX}latest`, 'json');
    if (latest) return latest;
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/site-stats') {
      try {
        return json(await getSiteStats(env));
      } catch {
        return json({ error: 'site stats unavailable' }, 503);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
