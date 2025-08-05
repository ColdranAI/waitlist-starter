ALTER TABLE "waitlist_entries" ADD COLUMN "ip_address" varchar(45) NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_entries" DROP COLUMN "user_agent";--> statement-breakpoint
ALTER TABLE "waitlist_entries" DROP COLUMN "referrer";