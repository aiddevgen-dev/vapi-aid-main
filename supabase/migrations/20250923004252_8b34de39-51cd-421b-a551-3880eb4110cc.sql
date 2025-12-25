-- Fix Agent Smith's missing user_id by assigning them to an existing user
UPDATE agents 
SET user_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af' 
WHERE id = '1ff3adbd-60ce-4819-99bc-34bd7d549d16' AND user_id IS NULL;

-- Also update the ringing call to be assigned to the user we have logged in
UPDATE calls 
SET agent_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af' 
WHERE id = 'd24d0afc-e3e8-4e87-bcd5-d27cb8f6a350' AND call_status = 'ringing';