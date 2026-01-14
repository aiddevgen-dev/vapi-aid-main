-- Add vapi_call_id column to calls table for storing VAPI call identifiers
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS vapi_call_id TEXT;

-- Create index for faster lookups by vapi_call_id
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON public.calls(vapi_call_id);
