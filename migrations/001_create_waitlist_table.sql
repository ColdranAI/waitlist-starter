-- Create waitlist_entries table
CREATE TABLE IF NOT EXISTS waitlist_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    referrer TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'converted'))
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_email ON waitlist_entries(email);

-- Create index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created_at ON waitlist_entries(created_at);

-- Create index on status for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON waitlist_entries(status); 