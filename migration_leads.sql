-- Create leads table for demo notification modal lead capture
-- This migration captures user interest in PMO AI integration

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    company TEXT,
    source TEXT DEFAULT 'demo_notification',
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Add RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see leads from their own organization
CREATE POLICY "Users can view own organization leads" ON leads
    FOR SELECT USING (organization_id = auth.uid());

-- Policy: Users can insert leads for their own organization
CREATE POLICY "Users can insert own organization leads" ON leads
    FOR INSERT WITH CHECK (organization_id = auth.uid());

-- Policy: Service role can do anything (for backend operations)
CREATE POLICY "Service role full access" ON leads
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
