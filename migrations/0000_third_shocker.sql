CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"status" varchar(20) DEFAULT 'pending',
	CONSTRAINT "waitlist_entries_email_unique" UNIQUE("email")
);
