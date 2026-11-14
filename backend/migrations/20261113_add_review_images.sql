-- Run once against existing PostgreSQL databases before deploying the review image API.
ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS images JSON NOT NULL DEFAULT '[]'::json;
