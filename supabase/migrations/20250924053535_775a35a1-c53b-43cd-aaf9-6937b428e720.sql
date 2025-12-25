-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own sessions" ON chat_sessions;

-- Create a new policy that allows:
-- 1. Users to see their own sessions (user_id = auth.uid())
-- 2. Agents to see sessions assigned to them (agent_id = auth.uid()) 
-- 3. Agents to see unassigned escalated sessions (status = 'escalated' AND agent_id IS NULL)
CREATE POLICY "Enhanced session visibility for agents and users" ON chat_sessions
FOR SELECT USING (
  -- Users can see their own sessions
  (auth.uid() = user_id) 
  OR
  -- Agents can see sessions assigned to them
  (auth.uid() = agent_id)
  OR
  -- Agents can see unassigned escalated sessions (for taking over)
  (status = 'escalated' AND agent_id IS NULL AND auth.uid() IS NOT NULL)
);