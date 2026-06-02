/**
 * slop-meter — anonymous "is this AI slop?" voting API.
 *
 * Endpoints:
 *   POST /vote   { id: string, score: 0..100 }  -> records/updates a vote, returns stats
 *   GET  /stats?id=<id>                          -> { id, count, average, histogram }
 *   GET  /                                       -> health check
 *
 * Storage: Cloudflare D1 (see schema.sql).
 * Privacy: no accounts, no cookies. Dedup uses a salted hash of
 *          (SALT + day + post_id + IP); the raw IP is never stored.
 *
 * This worker is intentionally site-agnostic — `id` is any opaque string,
 * so the same deployment can serve many sites.
 */

const ID_RE = /^[\w\-/:.]{1,128}$/;

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

async function getStats(env, postId) {
  const agg = await env.DB.prepare(
    'SELECT COUNT(*) AS n, AVG(score) AS avg FROM votes WHERE post_id = ?'
  )
    .bind(postId)
    .first();

  const rows = await env.DB.prepare(
    `SELECT (CASE WHEN score >= 100 THEN 9 ELSE score / 10 END) AS bucket, COUNT(*) AS c
     FROM votes WHERE post_id = ? GROUP BY bucket`
  )
    .bind(postId)
    .all();

  const histogram = Array(10).fill(0);
  for (const r of rows.results ?? []) histogram[r.bucket] = r.c;

  const count = agg?.n ?? 0;
  return {
    id: postId,
    count,
    average: count ? Math.round(agg.avg) : null,
    histogram,
  };
}

async function getSummary(env) {
  const rows = await env.DB.prepare(
    `SELECT post_id,
            COUNT(*)          AS count,
            ROUND(AVG(score)) AS average,
            MIN(score)        AS min,
            MAX(score)        AS max,
            MAX(created_at)   AS last_at
     FROM votes
     GROUP BY post_id
     ORDER BY count DESC, average DESC`
  ).all();
  return { posts: rows.results ?? [] };
}

function authed(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

export default {
  async fetch(request, env) {
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

        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
        const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
        const ipHash = (await sha256Hex(`${env.SALT || ''}|${day}|${body.id}|${ip}`)).slice(0, 32);

        await env.DB.prepare(
          `INSERT INTO votes (post_id, score, created_at, vote_day, ip_hash)
           VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(post_id, vote_day, ip_hash)
           DO UPDATE SET score = ?2, created_at = ?3`
        )
          .bind(body.id, score, Date.now(), day, ipHash)
          .run();

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

      if (url.pathname === '/' && request.method === 'GET') {
        return json({ service: 'slop-meter', ok: true }, 200, headers);
      }

      return json({ error: 'not found' }, 404, headers);
    } catch (err) {
      return json({ error: 'server error' }, 500, headers);
    }
  },
};
