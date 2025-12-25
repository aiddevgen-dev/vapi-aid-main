-- Add user_id column to agents table to link agents with users
ALTER TABLE agents ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create a default agent record for the current test user
INSERT INTO agents (id, name, status, user_id) 
VALUES ('e4f8f116-db2a-42e1-946b-39c18c91e2af', 'Jane Agent', 'online', 'e4f8f116-db2a-42e1-946b-39c18c91e2af')
ON CONFLICT (id) DO UPDATE SET user_id = 'e4f8f116-db2a-42e1-946b-39c18c91e2af';