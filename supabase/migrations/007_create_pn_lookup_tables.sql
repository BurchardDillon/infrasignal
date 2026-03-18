-- PN-to-Account Matcher tables
-- Run in Supabase SQL Editor

-- Table 1: component_lookups (cached PN resolutions)
CREATE TABLE component_lookups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number text NOT NULL,
  manufacturer text,
  description text,
  category text,
  subcategory text,
  socket_platform text,
  ecosystem text,
  specs jsonb DEFAULT '{}',
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(part_number)
);

CREATE INDEX idx_component_lookups_pn ON component_lookups(part_number);
CREATE INDEX idx_component_lookups_category ON component_lookups(category);

CREATE TRIGGER trg_component_lookups_updated_at
  BEFORE UPDATE ON component_lookups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table 2: account_hardware_prefs (what each account buys)
CREATE TABLE account_hardware_prefs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  buys_cpus boolean DEFAULT false,
  buys_gpus boolean DEFAULT false,
  buys_memory boolean DEFAULT false,
  buys_ssds boolean DEFAULT false,
  buys_networking boolean DEFAULT false,
  buys_systems boolean DEFAULT false,
  buys_frus boolean DEFAULT false,
  cpu_ecosystem text[] DEFAULT '{}',
  gpu_ecosystem text[] DEFAULT '{}',
  platforms text[] DEFAULT '{}',
  account_type text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id)
);

CREATE INDEX idx_account_hw_prefs_account ON account_hardware_prefs(account_id);
CREATE INDEX idx_account_hw_prefs_type ON account_hardware_prefs(account_type);

CREATE TRIGGER trg_account_hw_prefs_updated_at
  BEFORE UPDATE ON account_hardware_prefs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table 3: deal_history (past buys/sells for intelligence)
CREATE TABLE deal_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  part_number text NOT NULL,
  manufacturer text,
  description text,
  quantity integer,
  direction text NOT NULL CHECK (direction IN ('buy', 'sell', 'rfq')),
  deal_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_history_account ON deal_history(account_id);
CREATE INDEX idx_deal_history_pn ON deal_history(part_number);
