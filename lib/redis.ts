import { createClient } from 'redis'

// Validate Redis URL for TLS
function validateRedisUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    
    // Allow local/containerized Redis connections without TLS
    const isLocal = parsed.hostname === 'localhost' || 
                   parsed.hostname === '127.0.0.1' || 
                   parsed.hostname === '0.0.0.0' ||
                   parsed.hostname.includes('redis') || // Docker service names
                   parsed.hostname.endsWith('.local')
    
    if (parsed.protocol !== 'rediss:' && process.env.NODE_ENV === 'production' && !isLocal) {
      console.warn('Warning: Redis connection is not using TLS/SSL in production for external Redis')
    }
    
    if (parsed.protocol !== 'rediss:' && isLocal) {
      console.log('Using local Redis connection without TLS (this is fine for local/containerized setups)')
    }
    
    return true
  } catch (e) {
    console.error('Invalid Redis URL:', e)
    return false
  }
}

// Create Redis client
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required')
}

if (!validateRedisUrl(process.env.REDIS_URL)) {
  throw new Error('Redis URL validation failed')
}

console.log('Connecting to Redis with URL:', process.env.REDIS_URL.replace(/\/\/.*@/, '//***:***@'))

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
})

client.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('ready', () => {
  console.log('Redis client ready')
})

// Connect to Redis
if (!client.isOpen) {
  client.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err)
  })
}

// Create a wrapper to match the interface used in the rest of the app
class RedisWrapper {
  private client: any

  constructor(redisClient: any) {
    this.client = redisClient
  }

  async get<T = string>(key: string): Promise<T | null> {
    try {
      const result = await this.client.get(key)
      if (result === null) return null
      
      // Try to parse JSON, fall back to string
      try {
        return JSON.parse(result)
      } catch {
        return result as T
      }
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      await this.client.set(key, serialized)
    } catch (error) {
      console.error('Redis SET error:', error)
    }
  }

  async setex(key: string, seconds: number, value: any): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      await this.client.setEx(key, seconds, serialized)
    } catch (error) {
      console.error('Redis SETEX error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key)
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds)
    } catch (error) {
      console.error('Redis EXPIRE error:', error)
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error('Redis TTL error:', error)
      return -1
    }
  }

  async lpush(key: string, value: string): Promise<void> {
    try {
      await this.client.lPush(key, value)
    } catch (error) {
      console.error('Redis LPUSH error:', error)
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.client.lTrim(key, start, stop)
    } catch (error) {
      console.error('Redis LTRIM error:', error)
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.client.ping()
    } catch (error) {
      console.error('Redis PING error:', error)
      return 'ERROR'
    }
  }
}

export const redis = new RedisWrapper(client) 