-- Add escalated_at column to the chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN escalated_at timestamp with time zone;