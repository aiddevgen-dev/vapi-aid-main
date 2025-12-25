-- Drop the existing update policy
DROP POLICY IF EXISTS "Enhanced session update for agents and users" ON chat_sessions;

-- Create a new update policy that allows agents to hand back sessions
-- We need to check the current state (USING clause) vs the new state (WITH CHECK clause)
CREATE POLICY "Enhanced session update for agents and users" ON chat_sessions
FOR UPDATE 
USING (
  -- Users can update their own sessions
  (auth.uid() = user_id) 
  OR
  -- Agents can update sessions currently assigned to them (allows handing back to AI)
  (auth.uid() = agent_id)
  OR
  -- Agents can take over unassigned escalated sessions
  (status = 'escalated' AND agent_id IS NULL AND auth.uid() IS NOT NULL)
)
WITH CHECK (
  -- Users can update their own sessions
  (auth.uid() = user_id) 
  OR
  -- Agents can update sessions assigned to them
  (auth.uid() = agent_id)
  OR
  -- Agents can take over unassigned escalated sessions
  (status = 'escalated' AND agent_id IS NULL AND auth.uid() IS NOT NULL)
  OR
  -- Allow agents to hand sessions back to AI (set agent_id to null)
  (agent_id IS NULL AND status = 'active' AND auth.uid() IS NOT NULL)
);