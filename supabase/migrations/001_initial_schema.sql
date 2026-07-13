-- Ensure owner_id columns exist for RLS scoping
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id UUID NOT NULL REFERENCES auth.users(id);
ALTER TABLE dnc_list ADD COLUMN IF NOT EXISTS owner_id UUID NOT NULL REFERENCES auth.users(id);
ALTER TABLE qualification_data ADD COLUMN IF NOT EXISTS owner_id UUID NOT NULL REFERENCES auth.users(id);
