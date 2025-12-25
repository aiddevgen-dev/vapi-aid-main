-- Clean up old in-progress calls that are older than 1 hour
UPDATE calls 
SET call_status = 'completed', 
    ended_at = now(), 
    updated_at = now() 
WHERE call_status = 'in-progress' 
AND started_at < now() - interval '1 hour';