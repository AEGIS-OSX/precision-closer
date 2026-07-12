-- 001_initial_schema.sql
-- Precision Closer: Initial database schema
-- Enables uuid-ossp, creates all seven tables, trigger function, and indexes.

-- ============================================================
-- Extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. dnc_list
-- ============================================================
CREATE TABLE dnc_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL UNIQUE,
    reason TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dnc_phone ON dnc_list(phone_number);

-- ============================================================
-- 3. leads
-- ============================================================
CREATE TABLE leads (
    id TEXT PRIMARY KEY DEFAULT 'lead_' || substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    company_name TEXT,
    status TEXT NOT NULL DEFAULT 'not_called' CHECK (status IN ('not_called','dialing','connected','qualified','not_interested','no_answer','voicemail','failed')),
    metadata JSONB,
    dnc BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_phone_number ON leads(phone_number);

-- ============================================================
-- 4. calls
-- ============================================================
CREATE TABLE calls (
    id TEXT PRIMARY KEY DEFAULT 'call_' || substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    script_id TEXT NOT NULL,
    voice_id TEXT,
    status TEXT NOT NULL DEFAULT 'dialing' CHECK (status IN ('dialing','ringing','connected','completed','failed','no_answer','voicemail','busy','bridging','bridged')),
    provider TEXT NOT NULL DEFAULT 'twilio' CHECK (provider IN ('twilio','telnyx')),
    provider_call_id TEXT,
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_provider_call_id ON calls(provider_call_id);

-- ============================================================
-- 5. call_transcripts
-- ============================================================
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    speaker TEXT NOT NULL CHECK (speaker IN ('agent','lead')),
    text TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    timestamp_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_call_transcripts_call_id ON call_transcripts(call_id);
CREATE INDEX idx_call_transcripts_call_id_sequence ON call_transcripts(call_id, sequence);

-- ============================================================
-- 6. qualification_data
-- ============================================================
CREATE TABLE qualification_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    still_looking BOOLEAN,
    capital_type TEXT CHECK (capital_type IN ('term_loan','line_of_credit','mca','equipment_financing','other')),
    amount_requested INTEGER,
    use_of_funds TEXT,
    active_debt BOOLEAN,
    credit_score_range TEXT CHECK (credit_score_range IN ('below_580','580_619','620_659','660_699','700_719','720_750','above_750','unknown')),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_qualification_data_lead_call ON qualification_data(lead_id, call_id);

-- ============================================================
-- 7. takeover_events
-- ============================================================
CREATE TABLE takeover_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    bridge_token TEXT,
    bridge_token_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_takeover_events_call_id ON takeover_events(call_id);

-- ============================================================
-- Trigger function: update_updated_at_column()
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Apply triggers to tables with updated_at
-- ============================================================
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON qualification_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
