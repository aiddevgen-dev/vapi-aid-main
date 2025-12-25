-- Remove the foreign key constraint on auth.users and just use UUID
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_user_id_fkey;

-- Update the webhook assignment logic by finding agents by user_id
-- But first, let's update the existing call to be assigned to the correct agent
UPDATE calls 
SET agent_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af' 
WHERE twilio_call_sid = 'CA86bac59bf3e234fe142a84ec0d2f17c9' AND call_status = 'ringing';

-- Make sure the current user has an agent record
UPDATE agents 
SET user_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af' 
WHERE id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af';