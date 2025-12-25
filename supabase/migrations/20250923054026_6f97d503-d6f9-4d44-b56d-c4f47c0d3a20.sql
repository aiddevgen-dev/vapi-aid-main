-- Clean up old in-progress calls that are causing state issues
-- Mark calls that have been in-progress for more than 1 hour as completed
UPDATE calls 
SET 
  call_status = 'completed',
  ended_at = NOW(),
  updated_at = NOW()
WHERE 
  call_status = 'in-progress' 
  AND started_at < NOW() - INTERVAL '1 hour';

-- Add logging to see what we're cleaning up
SELECT 
  id,
  twilio_call_sid,
  customer_number,
  call_status,
  started_at,
  EXTRACT(EPOCH FROM (NOW() - started_at))/3600 as hours_in_progress
FROM calls 
WHERE call_status = 'in-progress' 
ORDER BY started_at ASC;