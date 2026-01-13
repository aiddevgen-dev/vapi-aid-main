-- Create workflows table for storing company workflows
-- This replaces localStorage storage with database persistence

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'temporal-outbound',
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  tools TEXT[] DEFAULT '{}',
  actions TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  ai_agent_id TEXT,
  vapi_assistant_id TEXT,
  vapi_phone_number_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies can view their own workflows
CREATE POLICY "Companies can view own workflows" ON public.workflows
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Companies can create workflows for their company
CREATE POLICY "Companies can create workflows" ON public.workflows
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Companies can update their own workflows
CREATE POLICY "Companies can update own workflows" ON public.workflows
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

-- Companies can delete their own workflows
CREATE POLICY "Companies can delete own workflows" ON public.workflows
  FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON public.workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);

-- Add comments for documentation
COMMENT ON TABLE public.workflows IS 'Stores workflow configurations for companies. Workflows define automated actions triggered by various sources.';
