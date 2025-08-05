import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core'

export const waitlistEntries = pgTable('waitlist_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  status: varchar('status', { length: 20 }).default('pending').$type<'pending' | 'notified' | 'converted'>(),
})

export type WaitlistEntry = typeof waitlistEntries.$inferSelect
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert 