-- slop-meter vote store (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     TEXT    NOT NULL,
  score       INTEGER NOT NULL,        -- 0 (human craft) .. 100 (pure slop)
  created_at  INTEGER NOT NULL,        -- unix epoch ms
  vote_day    TEXT    NOT NULL,        -- YYYY-MM-DD (UTC)
  ip_hash     TEXT    NOT NULL         -- salted, daily, per-post hash — never the raw IP
);

CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(post_id);

-- One vote per (anonymous bucket, post, day); a re-vote updates the score in place.
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_dedup ON votes(post_id, vote_day, ip_hash);
