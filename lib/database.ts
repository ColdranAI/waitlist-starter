import { db } from "./db";
import { waitlistEntries } from "./schema";
import { eq, count, sql } from "drizzle-orm";
import { redis } from "./redis";

// Email validation regex
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  status: "pending" | "notified" | "converted";
}

export interface WaitlistStats {
  totalEntries: number;
}

export class WaitlistService {
  // Validate and sanitize email
  private static validateEmail(email: string): {
    isValid: boolean;
    sanitized: string;
  } {
    if (!email || typeof email !== "string") {
      return { isValid: false, sanitized: "" };
    }

    const sanitized = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(sanitized)) {
      return { isValid: false, sanitized };
    }

    if (sanitized.length > 254) {
      // RFC 5321
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized };
  }

  // Add email to waitlist
  static async addEmail(email: string): Promise<{
    success: boolean;
    message: string;
    id?: string;
    isExisting?: boolean;
  }> {
    try {
      console.log("=== Starting email addition process ===");
      console.log("Email:", email);
      console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

      // Test database connection first
      try {
        console.log("Testing database connection...");
        await db.execute(sql`SELECT 1 as connection_test`);
        console.log("✅ Database connection successful");
      } catch (dbError) {
        console.error("❌ Database connection failed:", dbError);
        throw new Error("Database connection failed");
      }

      // Validate email
      const { isValid, sanitized } = this.validateEmail(email);
      if (!isValid) {
        console.log("❌ Email validation failed:", email);
        return {
          success: false,
          message: "Invalid email address format",
        };
      }
      console.log("✅ Email validation passed:", sanitized);

      console.log("📝 Attempting to insert into PostgreSQL database...");
      console.log("Insert data:", {
        email: sanitized,
        status: "pending",
      });

      try {
        const result = await db
          .insert(waitlistEntries)
          .values({
            email: sanitized,
            status: "pending",
          })
          .returning({ id: waitlistEntries.id });

        const id = result[0]?.id;
        console.log("✅ PostgreSQL INSERT successful!");
        console.log("Generated ID:", id);

        // Invalidate cache
        await redis.del("waitlist_stats");
        console.log("✅ Cache invalidated for stats after new email added");

        // Track in analytics
        await this.trackEvent("email_added", {
          email: sanitized,
          domain: sanitized.split("@")[1],
        });

        console.log("=== Email addition process completed successfully ===");
        return {
          success: true,
          message: "Email added successfully",
          id,
        };
      } catch (insertError: any) {
        // Handle unique constraint violation (email already exists)
        if (
          insertError?.code === "23505" ||
          insertError?.constraint === "waitlist_entries_email_unique"
        ) {
          console.log(
            "📧 Email already exists (unique constraint):",
            sanitized,
          );

          // Get the existing entry ID for consistency
          try {
            const existing = await db
              .select({ id: waitlistEntries.id })
              .from(waitlistEntries)
              .where(eq(waitlistEntries.email, sanitized))
              .limit(1);

            return {
              success: false,
              message: "You're already on the waitlist! 🚀",
              isExisting: true,
              id: existing[0]?.id,
            };
          } catch {
            return {
              success: false,
              message: "You're already on the waitlist! 🚀",
              isExisting: true,
            };
          }
        }

        // Re-throw other database errors
        throw insertError;
      }
    } catch (error) {
      console.error("=== EMAIL ADDITION FAILED ===");
      console.error("Failed to add email:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : error,
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );
      return {
        success: false,
        message: "Failed to add email to database",
      };
    }
  }

  // Get total stats with caching
  static async getStats(): Promise<WaitlistStats> {
    const cacheKey = "waitlist_stats";

    try {
      // Check cache first
      const cached = await redis.get<WaitlistStats>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get total count using raw SQL to avoid schema issues
      const result = await db.execute(
        sql`SELECT COUNT(*) as count FROM waitlist_entries`,
      );

      const stats: WaitlistStats = {
        totalEntries: Number(result[0]?.count) || 0,
      };

      // Cache for 10 minutes
      await redis.setex(cacheKey, 600, stats);

      return stats;
    } catch (error) {
      console.error("Failed to get stats:", error);

      // Try fallback without cache if Redis fails
      try {
        const result = await db.execute(
          sql`SELECT COUNT(*) as count FROM waitlist_entries`,
        );
        return {
          totalEntries: Number(result[0]?.count) || 0,
        };
      } catch (dbError) {
        console.error("Database fallback also failed:", dbError);
        return {
          totalEntries: 0,
        };
      }
    }
  }

  // Track analytics events
  static async trackEvent(
    event: string,
    properties: Record<string, any>,
  ): Promise<void> {
    try {
      const eventData = {
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          source: "waitlist",
        },
      };

      // Store in Redis for batch processing
      await redis.lpush("analytics_events", JSON.stringify(eventData));

      // Keep only last 1000 events
      await redis.ltrim("analytics_events", 0, 999);
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }
}
