-- Migration: add content versioning + snapshots to an existing slop-meter D1.
-- Apply with:
--   wrangler d1 execute slop-meter --remote --file=migrations/0001_versioning.sql

ALTER TABLE votes ADD COLUMN content_version TEXT;

CREATE TABLE IF NOT EXISTS snapshots (
  post_id         TEXT    NOT NULL,
  content_version TEXT    NOT NULL,
  text            TEXT,
  source_url      TEXT,
  captured_at     INTEGER NOT NULL,
  PRIMARY KEY (post_id, content_version)
);
