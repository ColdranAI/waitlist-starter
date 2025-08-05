-- Update waitlist_entries table to add IP address and remove unused fields

-- Add IP address column
ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NOT NULL DEFAULT 'unknown';

-- Remove unused columns (if they exist)
ALTER TABLE waitlist_entries DROP COLUMN IF EXISTS user_agent;
ALTER TABLE waitlist_entries DROP COLUMN IF EXISTS referrer;

-- Create index on IP address for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_ip_address ON waitlist_entries(ip_address);

-- Update existing records to have a default IP address if they don't have one
UPDATE waitlist_entries SET ip_address = 'unknown' WHERE ip_address IS NULL OR ip_address = ''; 