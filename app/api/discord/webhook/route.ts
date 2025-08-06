import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { DiscordWebhookService } from '../../../../lib/discord-webhook';
import { getClientIP } from '../../../../lib/ip-utils';
import { checkGeneralRateLimit } from '../../../../lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    console.log("=== Discord Webhook API Request ===");
    
    const clientIP = getClientIP(request);
    console.log("Client IP:", clientIP);

    // General API rate limiting
    const generalRateLimit = await checkGeneralRateLimit(clientIP, 'discord-webhook');
    if (!generalRateLimit.success) {
      const resetMinutes = Math.ceil(
        (generalRateLimit.resetTime.getTime() - Date.now()) / 1000 / 60
      );
      console.log(`❌ General rate limit exceeded for IP ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          error: `Too many API requests. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`,
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.log("❌ Invalid JSON in request body");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    const { content, embeds, username, avatar_url } = body;

    // Validate required fields
    if (!content && !embeds) {
      return NextResponse.json(
        {
          success: false,
          error: "Either 'content' or 'embeds' is required",
        },
        { status: 400 }
      );
    }

    // Validate request using Discord service
    const validation = await DiscordWebhookService.validateRequest(request);
    if (!validation.success) {
      console.log("❌ Discord webhook validation failed:", validation.message);
      return NextResponse.json(
        {
          success: false,
          error: validation.message,
        },
        { status: 429 }
      );
    }

    // Validate content if provided
    if (content) {
      const contentValidation = await DiscordWebhookService.validateContent(content, clientIP);
      if (!contentValidation.success) {
        console.log("❌ Discord content validation failed:", contentValidation.message);
        return NextResponse.json(
          {
            success: false,
            error: contentValidation.message,
          },
          { status: 400 }
        );
      }
    }

    // Validate embeds content if provided
    if (embeds && Array.isArray(embeds)) {
      for (const embed of embeds) {
        if (embed.description) {
          const embedValidation = await DiscordWebhookService.validateContent(embed.description, clientIP);
          if (!embedValidation.success) {
            console.log("❌ Discord embed validation failed:", embedValidation.message);
            return NextResponse.json(
              {
                success: false,
                error: embedValidation.message,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Send webhook
    const result = await DiscordWebhookService.sendWebhook({
      content,
      embeds,
      username,
      avatar_url,
    });

    if (!result.success) {
      console.log("❌ Discord webhook send failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Discord webhook sent successfully");
    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error("=== Discord Webhook API Error ===");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const isConfigured = !!process.env.DISCORD_WEBHOOK_URL;
    
    return NextResponse.json({
      success: true,
      message: "Discord webhook API is operational",
      configured: isConfigured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Health check failed",
      },
      { status: 500 }
    );
  }
}