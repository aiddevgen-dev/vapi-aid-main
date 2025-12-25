-- Update the ringing calls to be assigned to the current logged-in user
UPDATE calls 
SET agent_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af' 
WHERE call_status = 'ringing' 
  AND agent_id = 'b61290fa-20dd-4162-bbd2-68203174a618';

-- Also update Agent Brown to have the correct user_id mapping
UPDATE agents 
SET user_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af' 
WHERE id = 'b61290fa-20dd-4162-bbd2-68203174a618' AND user_id IS NULL;