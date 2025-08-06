import { 
  checkDiscordWebhookRateLimit, 
  consumeDiscordWebhookRateLimit,
  checkGlobalDiscordRateLimit,
  checkDiscordContentSpam
} from './rate-limit';
import { getClientIP } from './ip-utils';

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

interface WebhookValidationResult {
  success: boolean;
  message?: string;
  resetTime?: Date;
}

export class DiscordWebhookService {
  private static webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  static async validateRequest(request: Request): Promise<WebhookValidationResult> {
    const clientIP = getClientIP(request);
    
    // Check IP-based rate limiting
    const ipRateLimit = await checkDiscordWebhookRateLimit(clientIP);
    if (!ipRateLimit.success) {
      const resetMinutes = Math.ceil(
        (ipRateLimit.resetTime.getTime() - Date.now()) / 1000 / 60
      );
      return {
        success: false,
        message: `Too many webhook requests from your location. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`,
        resetTime: ipRateLimit.resetTime,
      };
    }

    // Check global rate limiting
    const globalRateLimit = await checkGlobalDiscordRateLimit();
    if (!globalRateLimit.success) {
      const resetMinutes = Math.ceil(
        (globalRateLimit.resetTime.getTime() - Date.now()) / 1000 / 60
      );
      return {
        success: false,
        message: `System is experiencing high load. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`,
        resetTime: globalRateLimit.resetTime,
      };
    }

    return { success: true };
  }

  static async validateContent(content: string, ip: string): Promise<WebhookValidationResult> {
    // Basic content validation
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        message: "Content cannot be empty",
      };
    }

    if (content.length > 2000) {
      return {
        success: false,
        message: "Content is too long (max 2000 characters)",
      };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /https?:\/\/[^\s]+\.tk\b/gi,
      /https?:\/\/[^\s]+\.ml\b/gi,
      /https?:\/\/[^\s]+\.ga\b/gi,
      /https?:\/\/[^\s]+\.cf\b/gi,
      /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/gi,
      /\b(click here|act now|limited time|urgent)\b/gi,
      /@everyone|@here/gi,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(content))) {
      return {
        success: false,
        message: "Content contains suspicious patterns",
      };
    }

    // Check content-based spam
    const contentSpamCheck = await checkDiscordContentSpam(content, ip);
    if (!contentSpamCheck.success) {
      return {
        success: false,
        message: contentSpamCheck.reason || "Content flagged as spam",
      };
    }

    return { success: true };
  }

  static async sendWebhook(payload: DiscordWebhookPayload): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    if (!this.webhookUrl) {
      console.error("Discord webhook URL not configured");
      return {
        success: false,
        error: "Discord webhook not configured",
      };
    }

    try {
      console.log("Sending Discord webhook...");
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Discord webhook failed: ${response.status} ${response.statusText}`, errorText);
        
        if (response.status === 429) {
          return {
            success: false,
            error: "Discord rate limit exceeded. Please try again later.",
          };
        }
        
        return {
          success: false,
          error: `Discord webhook failed: ${response.status}`,
        };
      }

      console.log("✅ Discord webhook sent successfully");
      return {
        success: true,
        message: "Notification sent to Discord",
      };
    } catch (error) {
      console.error("Discord webhook error:", error);
      return {
        success: false,
        error: "Failed to send Discord notification",
      };
    }
  }

  static createWaitlistEmbed(email: string, totalEntries?: number): DiscordEmbed {
    return {
      title: "🎉 New Waitlist Signup!",
      description: `Someone just joined the waitlist!`,
      color: 0x00ff00, // Green color
      fields: [
        {
          name: "📧 Email",
          value: email,
          inline: true,
        },
        {
          name: "📊 Total Entries",
          value: totalEntries ? totalEntries.toString() : "Unknown",
          inline: true,
        },
        {
          name: "⏰ Time",
          value: new Date().toLocaleString(),
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Waitlist Notification System",
      },
    };
  }

  static async notifyWaitlistSignup(email: string, request: Request, totalEntries?: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const clientIP = getClientIP(request);
    
    try {
      // Validate request
      const validation = await this.validateRequest(request);
      if (!validation.success) {
        return {
          success: false,
          error: validation.message,
        };
      }

      // Create embed
      const embed = this.createWaitlistEmbed(email, totalEntries);
      const payload: DiscordWebhookPayload = {
        embeds: [embed],
        username: "Waitlist Bot",
      };

      // Validate content (using embed description for spam check)
      const contentValidation = await this.validateContent(
        embed.description || "", 
        clientIP
      );
      if (!contentValidation.success) {
        return {
          success: false,
          error: contentValidation.message,
        };
      }

      // Consume rate limits
      await consumeDiscordWebhookRateLimit(clientIP);

      // Send webhook
      return await this.sendWebhook(payload);
    } catch (error) {
      console.error("Discord notification error:", error);
      return {
        success: false,
        error: "Failed to send Discord notification",
      };
    }
  }
}