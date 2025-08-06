import { redis } from './redis'

export async function checkWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`
  const windowSec = 60
  const limit = 3
  
  try {
    console.log(`Checking rate limit for IP: ${ip}`)
    
    const current = await redis.get<string>(key)
    
    if (!current) {
      console.log(`✅ First request from IP ${ip} - rate limit OK`)
      return {
        success: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowSec * 1000)
      }
    }
    
    const currentCount = parseInt(current)
    
    if (currentCount >= limit) {
      const ttl = await redis.ttl(key)
      console.log(`❌ Rate limit exceeded for IP ${ip}: ${currentCount}/${limit}`)
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000)
      }
    }
    
    const remaining = limit - (currentCount + 1)
    
    console.log(`✅ Rate limit OK for IP ${ip}: ${currentCount}/${limit}`)
    return {
      success: true,
      remaining,
      resetTime: new Date(Date.now() + windowSec * 1000)
    }
    
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + windowSec * 1000),
      error: 'Rate limiting service unavailable'
    }
  }
}

export async function consumeWaitlistRateLimit(ip: string) {
  const key = `waitlist:rate:${ip}`
  const windowSec = 60
  
  try {
    console.log(`Consuming rate limit for IP: ${ip}`)
    
    const current = await redis.get<string>(key)
    
    if (!current) {
      await redis.setex(key, windowSec, "1")
      console.log(`✅ Rate limit consumed for IP ${ip} (first request)`)
    } else {
      await redis.incr(key)
      console.log(`✅ Rate limit consumed for IP ${ip}`)
    }
    
  } catch (error) {
    console.error('Failed to consume rate limit:', error)
  }
}

export async function checkGeneralRateLimit(ip: string, endpoint: string = 'general') {
  const key = `${endpoint}:rate:${ip}`
  const windowSec = 300
  const limit = 50
  
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

export async function checkEmailRateLimit(email: string) {
  const key = `waitlist:email:${email.toLowerCase()}`
  const windowSec = 3600
  const limit = 5
  
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

export async function consumeEmailRateLimit(email: string) {
  const key = `waitlist:email:${email.toLowerCase()}`
  const windowSec = 3600
  
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