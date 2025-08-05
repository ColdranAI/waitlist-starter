-- Remove IP address column from waitlist_entries table
ALTER TABLE waitlist_entries DROP COLUMN IF EXISTS ip_address;

-- Drop the IP address index if it exists
DROP INDEX IF EXISTS idx_waitlist_entries_ip_address; 