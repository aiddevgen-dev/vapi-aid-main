-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Agents can update sessions" ON chat_sessions;

-- Create a new update policy that allows:
-- 1. Users to update their own sessions (user_id = auth.uid())
-- 2. Agents to update sessions assigned to them (agent_id = auth.uid())
-- 3. Agents to take over unassigned escalated sessions (status = 'escalated' AND agent_id IS NULL)
CREATE POLICY "Enhanced session update for agents and users" ON chat_sessions
FOR UPDATE USING (
  -- Users can update their own sessions
  (auth.uid() = user_id) 
  OR
  -- Agents can update sessions assigned to them
  (auth.uid() = agent_id)
  OR
  -- Agents can take over unassigned escalated sessions
  (status = 'escalated' AND agent_id IS NULL AND auth.uid() IS NOT NULL)
);