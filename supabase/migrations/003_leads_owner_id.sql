-- Migration: add owner_id to leads table for IDOR protection
-- Ticket: 5f1af61a-db5a-4ca0-b419-c7dc860152a8

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Backfill existing rows: assign to first user as safe default.
-- Production environments must run a targeted backfill before applying NOT NULL.
UPDATE leads
SET owner_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE owner_id IS NULL;

ALTER TABLE leads
  ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS leads_owner_id_idx ON leads(owner_id);
