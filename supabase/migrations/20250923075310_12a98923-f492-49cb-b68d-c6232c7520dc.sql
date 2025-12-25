-- Enable real-time for transcripts and suggestions tables
ALTER TABLE public.transcripts REPLICA IDENTITY FULL;
ALTER TABLE public.suggestions REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;