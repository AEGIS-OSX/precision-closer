-- Migration: 002_rls_policies.sql
-- Purpose: Enable Row Level Security on all PII tables
-- Supabase project: cd85abc2-0176-4eff-abca-f6813eabe151
--
-- NOTE: service_role bypasses RLS by default in Supabase.
-- No explicit service_role policy is needed. Admin routes that use
-- SERVICE_ROLE_KEY retain full access without policy changes.
-- Anon role is explicitly denied on all tables below.
-- Authenticated (operator) access is scoped to rows they own via operator_id FK.

-- ============================================================
-- leads
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Deny all anon access
CREATE POLICY "deny_anon_leads" ON leads
  FOR ALL TO anon USING (false);

-- Authenticated operators see only their own leads
-- TODO: confirm FK column name from schema (assumed: operator_id)
CREATE POLICY "owner_only_leads" ON leads
  FOR ALL TO authenticated
  USING (auth.uid() = operator_id);

-- ============================================================
-- calls
-- ============================================================
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_calls" ON calls
  FOR ALL TO anon USING (false);

CREATE POLICY "owner_only_calls" ON calls
  FOR ALL TO authenticated
  USING (auth.uid() = operator_id);

-- ============================================================
-- qualification_data
-- ============================================================
ALTER TABLE qualification_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_qualification_data" ON qualification_data
  FOR ALL TO anon USING (false);

-- qualification_data links to leads; scope via lead's operator_id
CREATE POLICY "owner_only_qualification_data" ON qualification_data
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = qualification_data.lead_id
        AND leads.operator_id = auth.uid()
    )
  );

-- ============================================================
-- transcript_segments
-- ============================================================
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_transcript_segments" ON transcript_segments
  FOR ALL TO anon USING (false);

-- transcript_segments links to calls; scope via call's operator_id
CREATE POLICY "owner_only_transcript_segments" ON transcript_segments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = transcript_segments.call_id
        AND calls.operator_id = auth.uid()
    )
  );

-- ============================================================
-- takeover_events
-- ============================================================
ALTER TABLE takeover_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_takeover_events" ON takeover_events
  FOR ALL TO anon USING (false);

-- takeover_events links to calls; scope via call's operator_id
CREATE POLICY "owner_only_takeover_events" ON takeover_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = takeover_events.call_id
        AND calls.operator_id = auth.uid()
    )
  );

-- ============================================================
-- users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_users" ON users
  FOR ALL TO anon USING (false);

-- Users can only see their own row
CREATE POLICY "owner_only_users" ON users
  FOR ALL TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- dnc_list
-- ============================================================
ALTER TABLE dnc_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_dnc_list" ON dnc_list
  FOR ALL TO anon USING (false);

CREATE POLICY "owner_only_dnc_list" ON dnc_list
  FOR ALL TO authenticated
  USING (auth.uid() = operator_id);
