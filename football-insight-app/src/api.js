const BASE_RAW = import.meta.env.VITE_API_BASE_URL || "";
const BASE = BASE_RAW.replace(/\/+$/, "");

if (!BASE) {
  throw new Error(
    "VITE_API_BASE_URL non impostata. Crea .env.local nella root e riavvia npm run dev."
  );
}

const mem = new Map(); // cache in-memory per questa sessione
const SS_PREFIX = "fi_cache_v1:";

function nowMs() {
  return Date.now();
}

function ssKey(url) {
  return SS_PREFIX + url;
}

function readSession(url) {
  try {
    const raw = sessionStorage.getItem(ssKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed; // { exp, data }
  } catch {
    return null;
  }
}

function writeSession(url, data, ttlSeconds) {
  try {
    const exp = nowMs() + ttlSeconds * 1000;
    sessionStorage.setItem(ssKey(url), JSON.stringify({ exp, data }));
  } catch {
    // ignore quota / private mode
  }
}

async function fetchJson(url) {
  const r = await fetch(url);
  const text = await r.text();

  // HTML => url sbagliata / proxy
  if (text.trim().startsWith("<")) {
    throw new Error(`Risposta HTML ricevuta. URL: ${url}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Risposta non-JSON. URL: ${url}. Inizio: ${text.slice(0, 100)}`);
  }

  if (!r.ok) {
    throw new Error(`API ${r.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

/**
 * GET con cache: mem + sessionStorage.
 * Se cache valida => ritorna subito senza chiamare rete.
 */
async function apiGetCached(path, ttlSeconds) {
  const url = `${BASE}${path}`;

  // 1) memory cache
  const m = mem.get(url);
  if (m && m.exp > nowMs()) return m.data;

  // 2) session storage cache
  const s = readSession(url);
  if (s && s.exp > nowMs()) {
    mem.set(url, s); // rimetti anche in memory
    return s.data;
  }

  // 3) rete
  const data = await fetchJson(url);
  const entry = { exp: nowMs() + ttlSeconds * 1000, data };
  mem.set(url, entry);
  writeSession(url, data, ttlSeconds);
  return data;
}

function qs(params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // TTL lato client: leggermente più corto del server cache va benissimo
  topCompetitions: () => apiGetCached("/api/competitions/top", 6 * 60 * 60), // 6h
  standings: (code) => apiGetCached(`/api/competitions/${code}/standings`, 20 * 60), // 20m
  competitionMatches: (code, params) =>
    apiGetCached(`/api/competitions/${code}/matches${qs(params)}`, 5 * 60), // 5m

  team: (id) => apiGetCached(`/api/teams/${id}`, 24 * 60 * 60), // 24h
  teamMatches: (id, params) =>
    apiGetCached(`/api/teams/${id}/matches${qs(params)}`, 5 * 60), // 5m

  // Prefetch helpers (non ti servono response in UI)
  prefetchStandings: (code) => api.standings(code).catch(() => {}),
  prefetchMatches7d: (code) => {
    const today = new Date();
    const z = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const from = z.toISOString().slice(0, 10);
    const toD = new Date(z);
    toD.setDate(toD.getDate() + 7);
    const to = toD.toISOString().slice(0, 10);
    return api.competitionMatches(code, { from, to, limit: 120 }).catch(() => {});
  },
};
