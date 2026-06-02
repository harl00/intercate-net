/**
 * slop-meter — anonymous "is this AI slop?" voting API.
 *
 * Endpoints:
 *   POST /vote   { id, score, version?, source? }  -> records/updates a vote, returns stats
 *   GET  /stats?id=<id>                             -> { id, count, average, histogram }
 *   GET  /summary            (Bearer ADMIN_TOKEN)   -> { posts: [...] }
 *   GET  /versions?id=<id>   (Bearer ADMIN_TOKEN)   -> per-content-version breakdown (+&text=1)
 *   GET  /                                          -> health check
 *
 * Storage: Cloudflare D1 (see schema.sql).
 * Privacy: no accounts, no cookies. Dedup uses a salted hash of
 *          (SALT + day + post_id + IP); the raw IP is never stored.
 *
 * Content versioning: each vote can carry a `version` (a hash of the rated
 * content) and a `source` URL. The first time a new version is seen, the worker
 * captures a snapshot — one per (post, version), never per vote — so ratings can
 * be tied to the exact content that earned them as a post evolves. Two modes:
 *   SNAPSHOT_MODE=d1  (default) fetch source, verify hash, store the text.
 *   SNAPSHOT_MODE=ref            store only the source URL (e.g. a git-pinned
 *                                raw URL); reconstruct text on demand.
 *   SNAPSHOT_MODE=off            store the version on votes, capture nothing.
 *
 * This worker is intentionally site-agnostic — `id` is any opaque string,
 * so the same deployment can serve many sites.
 */

const ID_RE = /^[\w\-/:.]{1,128}$/;
const VERSION_RE = /^[a-f0-9]{8,64}$/;

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGINS || '*').trim();
  const reqOrigin = request.headers.get('Origin') || '';
  let allowOrigin = '*';
  if (allowed !== '*') {
    const list = allowed.split(',').map((s) => s.trim());
    allowOrigin = list.includes(reqOrigin) ? reqOrigin : list[0] || '*';
  }
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function clampScore(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

// Only fetch snapshot sources from explicitly-allowed origins (SSRF guard).
function sourceOriginAllowed(env, urlStr) {
  const allowed = (env.SNAPSHOT_SOURCE_ORIGINS || env.ALLOWED_ORIGINS || '').trim();
  if (!allowed || allowed === '*') return false; // never fetch arbitrary origins
  let origin;
  try { origin = new URL(urlStr).origin; } catch { return false; }
  return allowed.split(',').map((s) => s.trim()).includes(origin);
}

// Capture one snapshot per (post, version). Runs in the background (waitUntil).
async function captureSnapshot(env, postId, version, source) {
  const mode = (env.SNAPSHOT_MODE || 'd1').toLowerCase();
  if (mode === 'off') return;

  const existing = await env.DB.prepare(
    'SELECT 1 FROM snapshots WHERE post_id = ? AND content_version = ?'
  ).bind(postId, version).first();
  if (existing) return;

  if (mode === 'ref') {
    await env.DB.prepare(
      `INSERT INTO snapshots (post_id, content_version, text, source_url, captured_at)
       VALUES (?1, ?2, NULL, ?3, ?4)
       ON CONFLICT(post_id, content_version) DO NOTHING`
    ).bind(postId, version, source || null, Date.now()).run();
    return;
  }

  // d1 mode: fetch the source, verify it hashes to the claimed version, store it.
  if (!source || !sourceOriginAllowed(env, source)) return;
  let text;
  try {
    const res = await fetch(source, { cf: { cacheTtl: 0 } });
    if (!res.ok) return;
    text = await res.text();
  } catch {
    return;
  }
  const hash = (await sha256Hex(text)).slice(0, version.length);
  if (hash !== version) return; // content doesn't match the claimed version — don't store

  await env.DB.prepare(
    `INSERT INTO snapshots (post_id, content_version, text, source_url, captured_at)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(post_id, content_version) DO NOTHING`
  ).bind(postId, version, text, source, Date.now()).run();
}

async function getStats(env, postId) {
  const agg = await env.DB.prepare(
    'SELECT COUNT(*) AS n, AVG(score) AS avg FROM votes WHERE post_id = ?'
  ).bind(postId).first();

  const rows = await env.DB.prepare(
    `SELECT (CASE WHEN score >= 100 THEN 9 ELSE score / 10 END) AS bucket, COUNT(*) AS c
     FROM votes WHERE post_id = ? GROUP BY bucket`
  ).bind(postId).all();

  const histogram = Array(10).fill(0);
  for (const r of rows.results ?? []) histogram[r.bucket] = r.c;

  const count = agg?.n ?? 0;
  return { id: postId, count, average: count ? Math.round(agg.avg) : null, histogram };
}

async function getSummary(env) {
  const rows = await env.DB.prepare(
    `SELECT post_id,
            COUNT(*)          AS count,
            ROUND(AVG(score)) AS average,
            MIN(score)        AS min,
            MAX(score)        AS max,
            MAX(created_at)   AS last_at,
            COUNT(DISTINCT content_version) AS versions
     FROM votes
     GROUP BY post_id
     ORDER BY count DESC, average DESC`
  ).all();
  return { posts: rows.results ?? [] };
}

async function getVersions(env, postId, withText) {
  const rows = await env.DB.prepare(
    `SELECT v.content_version       AS version,
            COUNT(*)                AS count,
            ROUND(AVG(v.score))     AS average,
            MIN(v.score)            AS min,
            MAX(v.score)            AS max,
            MAX(v.created_at)       AS last_at,
            s.captured_at           AS snapshot_at,
            s.source_url            AS source_url,
            (s.text IS NOT NULL)    AS has_text
            ${withText ? ', s.text AS text' : ''}
     FROM votes v
     LEFT JOIN snapshots s
       ON s.post_id = v.post_id AND s.content_version = v.content_version
     WHERE v.post_id = ?
     GROUP BY v.content_version
     ORDER BY last_at DESC`
  ).bind(postId).all();
  return { id: postId, versions: rows.results ?? [] };
}

function authed(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = corsHeaders(env, request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      if (url.pathname === '/vote' && request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body || typeof body.id !== 'string' || !ID_RE.test(body.id)) {
          return json({ error: 'invalid id' }, 400, headers);
        }
        const score = clampScore(body.score);
        if (score === null) return json({ error: 'invalid score' }, 400, headers);

        const version =
          typeof body.version === 'string' && VERSION_RE.test(body.version) ? body.version : null;
        const source = typeof body.source === 'string' ? body.source : null;

        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
        const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
        const ipHash = (await sha256Hex(`${env.SALT || ''}|${day}|${body.id}|${ip}`)).slice(0, 32);

        await env.DB.prepare(
          `INSERT INTO votes (post_id, score, content_version, created_at, vote_day, ip_hash)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)
           ON CONFLICT(post_id, vote_day, ip_hash)
           DO UPDATE SET score = ?2, content_version = ?3, created_at = ?4`
        )
          .bind(body.id, score, version, Date.now(), day, ipHash)
          .run();

        // Capture the content snapshot once per version, in the background.
        if (version) ctx.waitUntil(captureSnapshot(env, body.id, version, source));

        const stats = await getStats(env, body.id);
        return json({ ok: true, you: score, ...stats }, 200, headers);
      }

      if (url.pathname === '/stats' && request.method === 'GET') {
        const id = url.searchParams.get('id');
        if (!id || !ID_RE.test(id)) return json({ error: 'invalid id' }, 400, headers);
        return json(await getStats(env, id), 200, headers);
      }

      if (url.pathname === '/summary' && request.method === 'GET') {
        if (!authed(request, env)) return json({ error: 'unauthorized' }, 401, headers);
        return json(await getSummary(env), 200, headers);
      }

      if (url.pathname === '/versions' && request.method === 'GET') {
        if (!authed(request, env)) return json({ error: 'unauthorized' }, 401, headers);
        const id = url.searchParams.get('id');
        if (!id || !ID_RE.test(id)) return json({ error: 'invalid id' }, 400, headers);
        const withText = url.searchParams.get('text') === '1';
        return json(await getVersions(env, id, withText), 200, headers);
      }

      if (url.pathname === '/' && request.method === 'GET') {
        return json({ service: 'slop-meter', ok: true }, 200, headers);
      }

      return json({ error: 'not found' }, 404, headers);
    } catch (err) {
      return json({ error: 'server error' }, 500, headers);
    }
  },
};
