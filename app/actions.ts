'use server'

import { headers } from 'next/headers'
import { checkWaitlistRateLimit, consumeWaitlistRateLimit, checkEmailRateLimit, consumeEmailRateLimit } from '../lib/rate-limit'
import { WaitlistService } from '../lib/database'
import { getClientIP, isCloudflareRequest } from '../lib/ip-utils'
import { sql } from 'drizzle-orm'

export async function joinWaitlist(formData: FormData) {
    const email = formData.get('email')

    console.log('=== Starting waitlist join process ===')
    console.log('Email:', email)

    // Get real client IP from Cloudflare headers
    const headersList = await headers()
    const request = new Request('https://dummy.com', {
        headers: headersList
    })
    const clientIP = getClientIP(request)
    const isFromCloudflare = isCloudflareRequest(request)
    
    console.log('Client IP:', clientIP)
    console.log('Request from Cloudflare:', isFromCloudflare)

    if (!email || typeof email !== 'string') {
        console.log('❌ Invalid email provided:', email)
        return {
            success: false,
            message: 'Please provide a valid email address'
        }
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email)) {
        console.log('❌ Email failed regex validation:', email)
        return {
            success: false,
            message: 'Please provide a valid email address'
        }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /test.*@/i,
        /fake.*@/i,
        /spam.*@/i,
        /temp.*@/i,
        /disposable.*@/i,
        /@.*\.tk$/i,
        /@.*\.ml$/i,
        /@.*\.ga$/i,
        /@.*\.cf$/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
        console.log('❌ Email matches suspicious pattern:', email)
        return {
            success: false,
            message: 'Please use a valid email address'
        }
    }

    // Check email length
    if (email.length > 254) {
        console.log('❌ Email too long:', email.length)
        return {
            success: false,
            message: 'Email address is too long'
        }
    }

    try {
        // 1. Check IP-based rate limiting (but don't consume quota yet)
        console.log('🚦 Checking IP rate limit...')
        const ipRateLimitResult = await checkWaitlistRateLimit(clientIP)
        
        if (!ipRateLimitResult.success) {
            const resetMinutes = Math.ceil((ipRateLimitResult.resetTime.getTime() - Date.now()) / 1000 / 60)
            console.log(`❌ IP rate limit exceeded for ${clientIP}`)
            return {
                success: false,
                message: `Too many requests from your location. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`
            }
        }
        console.log(`✅ IP rate limit OK (${ipRateLimitResult.remaining} remaining)`)

        // 2. Check email-based rate limiting
        console.log('📧 Checking email rate limit...')
        const emailRateLimitResult = await checkEmailRateLimit(email)
        
        if (!emailRateLimitResult.success) {
            const resetMinutes = Math.ceil((emailRateLimitResult.resetTime.getTime() - Date.now()) / 1000 / 60)
            console.log(`❌ Email rate limit exceeded for ${email}`)
            return {
                success: false,
                message: `Too many attempts with this email. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`
            }
        }
        console.log(`✅ Email rate limit OK (${emailRateLimitResult.remaining} remaining)`)

        // 3. Now consume both rate limit quotas (after all verifications passed)
        await consumeWaitlistRateLimit(clientIP)
        await consumeEmailRateLimit(email)

        // 4. Add email to database (handles unique constraint automatically)
        console.log('📧 Adding email to waitlist...')
        const result = await WaitlistService.addEmail(email)

        if (!result.success) {
            if (result.isExisting) {
                // Email already exists in database - this is OK, just inform the user
                console.log('✅ Email already in waitlist database')
                return {
                    success: true, // Return success so UI shows success state
                    message: "🎉 You're already on the waitlist! We'll be in touch soon."
                }
            } else {
                console.error('❌ Failed to add email:', result.message)
                throw new Error(result.message)
            }
        }

        console.log('✅ Email successfully added to database, ID:', result.id)



        console.log('=== Waitlist join process completed successfully ===')
        return {
            success: true,
            message: "🎉 Thanks for joining the waitlist! We'll be in touch soon."
        }

    } catch (error) {
        console.error('=== WAITLIST JOIN FAILED ===')
        console.error('Error in joinWaitlist:', error)
        console.error('Error details:', error instanceof Error ? error.message : error)
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        return {
            success: false,
            message: 'Something went wrong. Please try again later.'
        }
    }
}

// Get waitlist stats (public)
export async function getWaitlistStats() {
    try {
        const stats = await WaitlistService.getStats()
        return {
            success: true,
            data: stats
        }
    } catch (error) {
        console.error('Error fetching waitlist stats:', error)
        
        // Return a fallback response instead of failing completely
        return {
            success: true,
            data: {
                totalEntries: 0
            },
            message: 'Stats temporarily unavailable'
        }
    }
}

// Health check endpoint
export async function healthCheck() {
    try {
        console.log('Starting health check...')
        
        // Check environment variables
        const envCheck = {
            DATABASE_URL: !!process.env.DATABASE_URL,
            REDIS_URL: !!process.env.REDIS_URL,
            NODE_ENV: process.env.NODE_ENV
        }
        console.log('Environment variables check:', envCheck)

        // Check database connection
        console.log('Testing database connection...')
        const { db } = await import('../lib/db')
        const testQuery = await db.execute(sql`SELECT 1 as test`)
        console.log('Database test query result:', testQuery)

        // Test database table access
        console.log('Testing waitlist_entries table access...')
        const tableTest = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM waitlist_entries
        `)
        console.log('Table test result:', tableTest)
        const currentCount = Number(tableTest[0]?.count) || 0
        console.log('Current waitlist entries count:', currentCount)

        // Check Redis connection
        console.log('Testing Redis connection...')
        const { redis } = await import('../lib/redis')
        const pingResult = await redis.ping()
        console.log('Redis ping result:', pingResult)

        return {
            success: true,
            message: 'All systems operational',
            timestamp: new Date().toISOString(),
            services: {
                database: 'healthy',
                redis: 'healthy'
            },
            environment: envCheck,
            stats: {
                totalEntries: currentCount
            }
        }
    } catch (error) {
        console.error('Health check failed:', error)
        console.error('Error details:', error instanceof Error ? error.message : error)
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        
        return {
            success: false,
            message: 'System health check failed',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }
    }
}

