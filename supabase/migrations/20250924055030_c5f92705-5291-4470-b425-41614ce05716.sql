-- Fix the RLS policy WITH CHECK clause logic
DROP POLICY IF EXISTS "Allow session updates for agents and users" ON chat_sessions;

-- Create a corrected policy that properly handles agent handover
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
  -- Agents taking over sessions (assigning themselves) - check the OLD agent_id is null and NEW agent_id matches current user
  (auth.uid() = agent_id AND agent_id IS NOT NULL AND status = 'escalated')
  OR
  -- Critical: Allow agents to hand sessions back to AI - no agent_id constraint here
  (agent_id IS NULL AND status = 'active')
);