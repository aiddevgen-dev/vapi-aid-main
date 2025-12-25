-- Drop and recreate the update policy with proper logic for agent handover
DROP POLICY IF EXISTS "Allow session updates for agents and users" ON chat_sessions;
DROP POLICY IF EXISTS "Enhanced session update for agents and users" ON chat_sessions;

-- Create a comprehensive update policy that properly handles all cases
CREATE POLICY "Allow session updates for agents and users" ON chat_sessions
FOR UPDATE 
USING (
  -- Users can update their own sessions
  (auth.uid() = user_id) 
  OR
  -- Agents can update sessions currently assigned to them
  (auth.uid() = agent_id)
  OR
  -- Agents can take over unassigned escalated sessions
  (status = 'escalated' AND agent_id IS NULL AND auth.uid() IS NOT NULL)
)
WITH CHECK (
  -- Users can update their own sessions (keep them as users)
  (auth.uid() = user_id AND user_id IS NOT NULL) 
  OR
  -- Agents can take over sessions (assign themselves)
  (auth.uid() = agent_id AND agent_id IS NOT NULL)
  OR
  -- Critical: Allow agents to hand sessions back to AI (set agent_id to null)
  -- This is when an authenticated agent is removing themselves from the session
  (agent_id IS NULL AND status = 'active' AND auth.uid() IS NOT NULL)
);