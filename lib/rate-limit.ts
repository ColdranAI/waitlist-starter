import { redis } from './redis'

// IP-based rate limiting for waitlist endpoint
export async function checkWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`
  const windowSec = 60 // 60 seconds window
  const limit = 10 // allow 10 requests per minute per IP
  
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