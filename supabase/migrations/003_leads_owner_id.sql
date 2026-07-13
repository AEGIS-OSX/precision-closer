-- Migration: add owner_id to leads table for IDOR fix
-- Ticket: 5f1af61a-db5a-4ca0-b419-c7dc860152a8

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Backfill: assign existing rows to the first admin user found, or leave null
-- (rows without owner_id will be inaccessible to non-admin users, which is safe)
-- Production backfill should be done manually with correct user IDs.

-- Make owner_id NOT NULL going forward (after backfill)
-- ALTER TABLE leads ALTER COLUMN owner_id SET NOT NULL;
-- Uncomment the above after backfilling existing rows in production.

-- Index for ownership queries
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
