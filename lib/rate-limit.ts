import { redis } from './redis'

// IP-based rate limiting for waitlist endpoint
export async function checkWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`
  const windowSec = 60 // 60 seconds window
  const limit = 3 // allow only 3 requests per minute per IP (more restrictive)
  
  try {
    console.log(`Checking rate limit for IP: ${ip}`)
    
    const current = await redis.get<string>(key)
    
    if (!current) {
      // First request from this IP - just check, don't increment yet
      console.log(`✅ First request from IP ${ip} - rate limit OK`)
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000)
      }
    }
    
    const currentCount = parseInt(current)
    
    if (currentCount >= limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key)
      console.log(`❌ Rate limit exceeded for IP ${ip}: ${currentCount}/${limit}`)
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000)
      }
    }
    
    // Don't increment yet - just check if it would be allowed
    const remaining = limit - (currentCount + 1)
    
    console.log(`✅ Rate limit OK for IP ${ip}: ${currentCount}/${limit}`)
    return {
      success: true,
      remaining,
      resetTime: new Date(Date.now() + windowSec * 1000)
    }
    
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail closed for security
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
      error: 'Rate limiting service unavailable'
    }
  }
}

// Consume/increment the rate limit after successful verification
export async function consumeWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`
  const windowSec = 60 // 60 seconds window
  
  try {
    console.log(`Consuming rate limit for IP: ${ip}`)
    
    const current = await redis.get<string>(key)
    
    if (!current) {
      // First request from this IP
      await redis.setex(key, windowSec, "1")
      console.log(`✅ Rate limit consumed for IP ${ip} (first request)`)
    } else {
      // Increment the counter
      await redis.incr(key)
      console.log(`✅ Rate limit consumed for IP ${ip}`)
    }
    
  } catch (error) {
    console.error('Failed to consume rate limit:', error)
    // Don't throw - this is not critical for the operation
  }
}

// General rate limiting (can be used for other endpoints)
export async function checkGeneralRateLimit(ip: string, endpoint: string = 'general') {
  const key = `${endpoint}:rate:${ip}`
  const windowSec = 300 // 5 minutes window
  const limit = 50 // 50 requests per 5 minutes
  
  try {
    const current = await redis.get<string>(key)
    
    if (!current) {
      await redis.setex(key, windowSec, "1")
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000)
      }
    }
    
    const currentCount = parseInt(current)
    
    if (currentCount >= limit) {
      const ttl = await redis.ttl(key)
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000)
      }
    }
    
    await redis.incr(key)
    return {
      success: true,
      remaining: limit - (currentCount + 1),
      resetTime: new Date(Date.now() + windowSec * 1000)
    }
    
  } catch (error) {
    console.error('General rate limit check failed:', error)
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000)
    }
  }
}

// Email-based rate limiting to prevent spam from same email across different IPs
export async function checkEmailRateLimit(email: string) {
  const key = `waitlist:email:${email.toLowerCase()}`
  const windowSec = 3600 // 1 hour window
  const limit = 5 // allow only 5 attempts per hour per email
  
  try {
    console.log(`Checking email rate limit for: ${email}`)
    
    const current = await redis.get<string>(key)
    
    if (!current) {
      console.log(`✅ First attempt for email ${email} - rate limit OK`)
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000)
      }
    }
    
    const currentCount = parseInt(current)
    
    if (currentCount >= limit) {
      const ttl = await redis.ttl(key)
      console.log(`❌ Email rate limit exceeded for ${email}: ${currentCount}/${limit}`)
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000)
      }
    }
    
    const remaining = limit - (currentCount + 1)
    console.log(`✅ Email rate limit OK for ${email}: ${currentCount}/${limit}`)
    return {
      success: true,
      remaining,
      resetTime: new Date(Date.now() + windowSec * 1000)
    }
    
  } catch (error) {
    console.error('Email rate limit check failed:', error)
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
      error: 'Email rate limiting service unavailable'
    }
  }
}

// Consume email rate limit
export async function consumeEmailRateLimit(email: string) {
  const key = `waitlist:email:${email.toLowerCase()}`
  const windowSec = 3600 // 1 hour window
  
  try {
    console.log(`Consuming email rate limit for: ${email}`)
    
    const current = await redis.get<string>(key)
    
    if (!current) {
      await redis.setex(key, windowSec, "1")
      console.log(`✅ Email rate limit consumed for ${email} (first attempt)`)
    } else {
      await redis.incr(key)
      console.log(`✅ Email rate limit consumed for ${email}`)
    }
    
  } catch (error) {
    console.error('Failed to consume email rate limit:', error)
  }
}