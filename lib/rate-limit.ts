import { redis } from "./redis";

export async function checkWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`;
  const windowSec = 60;
  const limit = 3;

  try {
    console.log(`Checking rate limit for IP: ${ip}`);

    const current = await redis.get<string>(key);

    if (!current) {
      console.log(`✅ First request from IP ${ip} - rate limit OK`);
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000),
      };
    }

    const currentCount = parseInt(current);

    if (currentCount >= limit) {
      const ttl = await redis.ttl(key);
      console.log(
        `❌ Rate limit exceeded for IP ${ip}: ${currentCount}/${limit}`,
      );
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000),
      };
    }

    const remaining = limit - (currentCount + 1);

    console.log(`✅ Rate limit OK for IP ${ip}: ${currentCount}/${limit}`);
    return {
      success: true,
      remaining,
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
      error: "Rate limiting service unavailable",
    };
  }
}

export async function consumeWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`;
  const windowSec = 60;

  try {
    console.log(`Consuming rate limit for IP: ${ip}`);

    const current = await redis.get<string>(key);

    if (!current) {
      await redis.setex(key, windowSec, "1");
      console.log(`✅ Rate limit consumed for IP ${ip} (first request)`);
    } else {
      await redis.incr(key);
      console.log(`✅ Rate limit consumed for IP ${ip}`);
    }
  } catch (error) {
    console.error("Failed to consume rate limit:", error);
  }
}

export async function checkGeneralRateLimit(
  ip: string,
  endpoint: string = "general",
) {
  const key = `${endpoint}:rate:${ip}`;
  const windowSec = 300;
  const limit = 50;

  try {
    const current = await redis.get<string>(key);

    if (!current) {
      await redis.setex(key, windowSec, "1");
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000),
      };
    }

    const currentCount = parseInt(current);

    if (currentCount >= limit) {
      const ttl = await redis.ttl(key);
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000),
      };
    }

    await redis.incr(key);
    return {
      success: true,
      remaining: limit - (currentCount + 1),
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  } catch (error) {
    console.error("General rate limit check failed:", error);
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  }
}

export async function checkEmailRateLimit(email: string) {
  const key = `waitlist:email:${email.toLowerCase()}`;
  const windowSec = 3600;
  const limit = 5;

  try {
    console.log(`Checking email rate limit for: ${email}`);

    const current = await redis.get<string>(key);

    if (!current) {
      console.log(`✅ First attempt for email ${email} - rate limit OK`);
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000),
      };
    }

    const currentCount = parseInt(current);

    if (currentCount >= limit) {
      const ttl = await redis.ttl(key);
      console.log(
        `❌ Email rate limit exceeded for ${email}: ${currentCount}/${limit}`,
      );
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000),
      };
    }

    const remaining = limit - (currentCount + 1);
    console.log(
      `✅ Email rate limit OK for ${email}: ${currentCount}/${limit}`,
    );
    return {
      success: true,
      remaining,
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  } catch (error) {
    console.error("Email rate limit check failed:", error);
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
      error: "Email rate limiting service unavailable",
    };
  }
}

export async function consumeEmailRateLimit(email: string) {
  const key = `waitlist:email:${email.toLowerCase()}`;
  const windowSec = 3600;

  try {
    console.log(`Consuming email rate limit for: ${email}`);

    const current = await redis.get<string>(key);

    if (!current) {
      await redis.setex(key, windowSec, "1");
      console.log(`✅ Email rate limit consumed for ${email} (first attempt)`);
    } else {
      await redis.incr(key);
      console.log(`✅ Email rate limit consumed for ${email}`);
    }
  } catch (error) {
    console.error("Failed to consume email rate limit:", error);
  }
}

// Discord webhook rate limiting
export async function checkDiscordWebhookRateLimit(ip: string) {
  const key = `discord:webhook:${ip}`;
  const windowSec = 300; // 5 minutes
  const limit = 10; // 10 webhook calls per 5 minutes per IP

  try {
    console.log(`Checking Discord webhook rate limit for IP: ${ip}`);

    const current = await redis.get<string>(key);

    if (!current) {
      console.log(`✅ First Discord webhook request from IP ${ip} - rate limit OK`);
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000),
      };
    }

    const currentCount = parseInt(current);

    if (currentCount >= limit) {
      const ttl = await redis.ttl(key);
      console.log(
        `❌ Discord webhook rate limit exceeded for IP ${ip}: ${currentCount}/${limit}`,
      );
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000),
      };
    }

    const remaining = limit - (currentCount + 1);

    console.log(`✅ Discord webhook rate limit OK for IP ${ip}: ${currentCount}/${limit}`);
    return {
      success: true,
      remaining,
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  } catch (error) {
    console.error("Discord webhook rate limit check failed:", error);
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
      error: "Discord webhook rate limiting service unavailable",
    };
  }
}

export async function consumeDiscordWebhookRateLimit(ip: string) {
  const key = `discord:webhook:${ip}`;
  const windowSec = 300;

  try {
    console.log(`Consuming Discord webhook rate limit for IP: ${ip}`);

    const current = await redis.get<string>(key);

    if (!current) {
      await redis.setex(key, windowSec, "1");
      console.log(`✅ Discord webhook rate limit consumed for IP ${ip} (first request)`);
    } else {
      await redis.incr(key);
      console.log(`✅ Discord webhook rate limit consumed for IP ${ip}`);
    }
  } catch (error) {
    console.error("Failed to consume Discord webhook rate limit:", error);
  }
}

// Global Discord webhook rate limiting (prevents system-wide spam)
export async function checkGlobalDiscordRateLimit() {
  const key = `discord:global:rate`;
  const windowSec = 60; // 1 minute
  const limit = 50; // 50 total webhook calls per minute across all users

  try {
    const current = await redis.get<string>(key);

    if (!current) {
      await redis.setex(key, windowSec, "1");
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000),
      };
    }

    const currentCount = parseInt(current);

    if (currentCount >= limit) {
      const ttl = await redis.ttl(key);
      console.log(`❌ Global Discord webhook rate limit exceeded: ${currentCount}/${limit}`);
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000),
      };
    }

    await redis.incr(key);
    return {
      success: true,
      remaining: limit - (currentCount + 1),
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  } catch (error) {
    console.error("Global Discord webhook rate limit check failed:", error);
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
    };
  }
}

// Content-based spam detection for Discord webhooks
export async function checkDiscordContentSpam(content: string, ip: string) {
  const contentHash = Buffer.from(content).toString('base64').slice(0, 32);
  const key = `discord:content:${contentHash}`;
  const ipContentKey = `discord:ip-content:${ip}:${contentHash}`;
  const windowSec = 3600; // 1 hour
  const globalLimit = 5; // Same content can only be sent 5 times globally per hour
  const ipLimit = 2; // Same IP can only send same content 2 times per hour

  try {
    // Check global content spam
    const globalCount = await redis.get<string>(key);
    if (globalCount && parseInt(globalCount) >= globalLimit) {
      console.log(`❌ Discord content spam detected globally: ${contentHash}`);
      return {
        success: false,
        reason: "Content has been sent too frequently",
      };
    }

    // Check IP-specific content spam
    const ipCount = await redis.get<string>(ipContentKey);
    if (ipCount && parseInt(ipCount) >= ipLimit) {
      console.log(`❌ Discord content spam detected for IP ${ip}: ${contentHash}`);
      return {
        success: false,
        reason: "You have sent this content too frequently",
      };
    }

    // Increment counters
    if (!globalCount) {
      await redis.setex(key, windowSec, "1");
    } else {
      await redis.incr(key);
    }

    if (!ipCount) {
      await redis.setex(ipContentKey, windowSec, "1");
    } else {
      await redis.incr(ipContentKey);
    }

    return { success: true };
  } catch (error) {
    console.error("Discord content spam check failed:", error);
    return {
      success: false,
      reason: "Spam detection service unavailable",
    };
  }
}
