-- Enable leaked password protection for better security
-- This will check passwords against known leaked password databases
UPDATE auth.config 
SET leaked_password_protection = true;