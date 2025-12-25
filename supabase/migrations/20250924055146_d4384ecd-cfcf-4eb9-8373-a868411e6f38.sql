-- Fix the WITH CHECK clause to properly handle agent handover
DROP POLICY IF EXISTS "Allow session updates for agents and users" ON chat_sessions;

-- Create a corrected policy with proper handover logic
CREATE POLICY "Allow session updates for agents and users" ON chat_sessions
FOR UPDATE 
USING (
  -- Users can update their own sessions
  (auth.uid() = user_id) 
  OR
  -- Agents can update sessions currently assigned to them (including handing back)
  (auth.uid() = agent_id)
  OR
  -- Agents can take over unassigned escalated sessions
  (status = 'escalated' AND agent_id IS NULL AND auth.uid() IS NOT NULL)
)
WITH CHECK (
  -- Users can update their own sessions
  (auth.uid() = user_id AND user_id IS NOT NULL) 
  OR
  -- Agents taking over escalated sessions (assigning themselves)
  (auth.uid() = agent_id AND agent_id IS NOT NULL AND status = 'escalated')
  OR
  -- Allow any authenticated user to create unassigned active sessions (for handover)
  -- This covers the case where agent hands back to AI
  (agent_id IS NULL AND status = 'active' AND auth.uid() IS NOT NULL)
);