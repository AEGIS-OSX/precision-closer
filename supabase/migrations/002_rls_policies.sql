-- 002_rls_policies.sql
-- Precision Closer: Row-Level Security policies
-- Enables RLS on all seven tables, creates policies for authenticated operators,
-- then adds tables to the supabase_realtime publication.
-- Order is mandatory: RLS policies first, then ALTER PUBLICATION.

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnc_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeover_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- users: operators can read their own row
-- ============================================================
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (id = auth.uid());

-- ============================================================
-- dnc_list: operators can SELECT
-- ============================================================
CREATE POLICY "dnc_list_select_operators" ON dnc_list
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

-- ============================================================
-- leads: operators can SELECT, INSERT, UPDATE
-- ============================================================
CREATE POLICY "leads_select_operators" ON leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

CREATE POLICY "leads_insert_operators" ON leads
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

CREATE POLICY "leads_update_operators" ON leads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

-- ============================================================
-- calls: operators can SELECT, INSERT, UPDATE
-- ============================================================
CREATE POLICY "calls_select_operators" ON calls
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

CREATE POLICY "calls_insert_operators" ON calls
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

CREATE POLICY "calls_update_operators" ON calls
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

-- ============================================================
-- call_transcripts: operators can SELECT
-- ============================================================
CREATE POLICY "call_transcripts_select_operators" ON call_transcripts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

-- ============================================================
-- qualification_data: operators can SELECT
-- ============================================================
CREATE POLICY "qualification_data_select_operators" ON qualification_data
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('operator', 'admin')
        )
    );

-- ============================================================
-- takeover_events: operators can SELECT their own
-- ============================================================
CREATE POLICY "takeover_events_select_own" ON takeover_events
    FOR SELECT
    USING (operator_id = auth.uid());

-- ============================================================
-- Add tables to supabase_realtime publication
-- Must happen AFTER RLS policies (Supabase Realtime silent-drop mitigation)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_transcripts;
