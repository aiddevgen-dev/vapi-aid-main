-- Enable realtime for chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add chat_messages to realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;