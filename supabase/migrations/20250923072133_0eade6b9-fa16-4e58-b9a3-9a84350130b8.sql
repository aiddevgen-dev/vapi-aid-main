-- Add metadata column to the messages table
ALTER TABLE public.messages 
ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;