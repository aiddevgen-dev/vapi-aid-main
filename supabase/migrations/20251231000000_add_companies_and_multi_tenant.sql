-- Multi-tenant architecture: Add companies table and update agents table
-- This migration adds support for company role and multi-tenant agent management

-- Step 1: Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_user UNIQUE(user_id)
);

-- Step 2: Add company_id to agents table (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Create trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 4: Enable Row Level Security on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for companies table

-- Companies can view their own company data
CREATE POLICY "Companies can view own data" ON public.companies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Companies can update their own company data
CREATE POLICY "Companies can update own data" ON public.companies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can insert company data (during signup)
CREATE POLICY "Allow company creation during signup" ON public.companies
  FOR INSERT
  WITH CHECK (true);

-- Step 6: Update RLS policies for agents table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view agents" ON public.agents;
DROP POLICY IF EXISTS "Anyone can create agents" ON public.agents;

-- Companies can view their own agents
CREATE POLICY "Companies can view their agents" ON public.agents
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Companies can create agents for their company
CREATE POLICY "Companies can create agents" ON public.agents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Companies can update their agents
CREATE POLICY "Companies can update their agents" ON public.agents
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Agents can view their own profile
CREATE POLICY "Agents can view own profile" ON public.agents
  FOR SELECT
  USING (user_id = auth.uid());

-- Step 7: Update RLS policies for calls table

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view calls" ON public.calls;
DROP POLICY IF EXISTS "Anyone can create calls" ON public.calls;
DROP POLICY IF EXISTS "Anyone can update calls" ON public.calls;

-- Companies can view all calls from their agents
CREATE POLICY "Companies can view their agents calls" ON public.calls
  FOR SELECT
  USING (
    agent_id IN (
      SELECT a.id FROM public.agents a
      INNER JOIN public.companies c ON a.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Agents can view their own calls
CREATE POLICY "Agents can view own calls" ON public.calls
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- System can create calls (for incoming calls from Twilio)
CREATE POLICY "System can create calls" ON public.calls
  FOR INSERT
  WITH CHECK (true);

-- Agents can update their own calls
CREATE POLICY "Agents can update own calls" ON public.calls
  FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- Companies can update calls from their agents
CREATE POLICY "Companies can update their agents calls" ON public.calls
  FOR UPDATE
  USING (
    agent_id IN (
      SELECT a.id FROM public.agents a
      INNER JOIN public.companies c ON a.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Step 8: Update RLS policies for transcripts table

DROP POLICY IF EXISTS "Anyone can view transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Anyone can create transcripts" ON public.transcripts;

-- Companies can view transcripts from their agents' calls
CREATE POLICY "Companies can view their agents transcripts" ON public.transcripts
  FOR SELECT
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      INNER JOIN public.agents a ON c.agent_id = a.id
      INNER JOIN public.companies comp ON a.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Agents can view transcripts from their own calls
CREATE POLICY "Agents can view own transcripts" ON public.transcripts
  FOR SELECT
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      INNER JOIN public.agents a ON c.agent_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- System can create transcripts
CREATE POLICY "System can create transcripts" ON public.transcripts
  FOR INSERT
  WITH CHECK (true);

-- Step 9: Update RLS policies for suggestions table

DROP POLICY IF EXISTS "Anyone can view suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Anyone can create suggestions" ON public.suggestions;

-- Companies can view suggestions from their agents' calls
CREATE POLICY "Companies can view their agents suggestions" ON public.suggestions
  FOR SELECT
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      INNER JOIN public.agents a ON c.agent_id = a.id
      INNER JOIN public.companies comp ON a.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Agents can view suggestions from their own calls
CREATE POLICY "Agents can view own suggestions" ON public.suggestions
  FOR SELECT
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      INNER JOIN public.agents a ON c.agent_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- System can create suggestions
CREATE POLICY "System can create suggestions" ON public.suggestions
  FOR INSERT
  WITH CHECK (true);

-- Agents can update suggestions (mark as used)
CREATE POLICY "Agents can update own suggestions" ON public.suggestions
  FOR UPDATE
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      INNER JOIN public.agents a ON c.agent_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Step 10: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_company_id ON public.agents(company_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON public.calls(agent_id);

-- Step 11: Add comments for documentation
COMMENT ON TABLE public.companies IS 'Stores company information for multi-tenant support. Each company can have multiple agents.';
COMMENT ON COLUMN public.agents.company_id IS 'Foreign key to companies table. Links agent to their company.';
