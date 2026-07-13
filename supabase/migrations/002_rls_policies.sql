-- RLS Policies for precision-closer
-- Enables row-level security and scopes all data access to the authenticated owner.

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dnc_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- leads policies
CREATE POLICY "leads_owner_select" ON leads
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "leads_owner_insert" ON leads
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "leads_owner_update" ON leads
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "leads_owner_delete" ON leads
  FOR DELETE USING (auth.uid() = owner_id);

-- dnc_list policies
CREATE POLICY "dnc_list_owner_select" ON dnc_list
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "dnc_list_owner_insert" ON dnc_list
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dnc_list_owner_update" ON dnc_list
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "dnc_list_owner_delete" ON dnc_list
  FOR DELETE USING (auth.uid() = owner_id);

-- qualification_data policies
CREATE POLICY "qual_data_owner_select" ON qualification_data
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "qual_data_owner_insert" ON qualification_data
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "qual_data_owner_update" ON qualification_data
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "qual_data_owner_delete" ON qualification_data
  FOR DELETE USING (auth.uid() = owner_id);
