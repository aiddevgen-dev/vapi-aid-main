-- Drop the existing messages view policy that might be too restrictive
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON messages;

-- Create a new policy that properly handles agent access to session messages
CREATE POLICY "Enhanced message visibility for agents and users" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_sessions cs
    WHERE cs.id = messages.session_id 
    AND (
      -- Users can see messages in their own sessions
      cs.user_id = auth.uid()
      OR
      -- Agents can see messages in sessions assigned to them
      cs.agent_id = auth.uid()
      OR 
      -- Agents can see messages in escalated sessions they can potentially take
      (cs.status = 'escalated' AND cs.agent_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
);