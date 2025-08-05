# Setup Guide

This project supports both Upstash Redis and traditional Redis. Choose the option that best fits your deployment needs.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Required: Database
```bash
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
```

### Required: Redis Configuration

You have **two options** for Redis. Choose one:

#### Option 1: Upstash Redis (Recommended for serverless)
```bash
USE_UPSTASH=true
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

#### Option 2: Traditional Redis (VPS, Docker, etc.)
```bash
USE_UPSTASH=false
REDIS_URL=redis://username:password@hostname:port/database
```
## Redis Setup Options

### 🚀 Upstash Redis (Serverless)

**Best for:** Vercel, Netlify, Railway, and other serverless platforms

1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and Token from your dashboard
4. Set in your `.env.local`:
   ```bash
   USE_UPSTASH=true
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

**Pros:**
- ✅ Serverless-friendly
- ✅ No server management
- ✅ Automatic scaling
- ✅ Built-in monitoring

**Cons:**
- ❌ More expensive for high traffic
- ❌ Limited to REST API

### 🖥️ Traditional Redis (Self-hosted)

**Best for:** VPS, dedicated servers, Docker deployments

#### Local Development with Docker:
```bash
# Start Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Set in your .env.local
USE_UPSTASH=false
REDIS_URL=redis://localhost:6379
```

#### VPS/Dedicated Server:
1. Install Redis on your server
2. Configure Redis with your preferred settings
3. Set in your `.env.local`:
   ```bash
   USE_UPSTASH=false
   REDIS_URL=redis://username:password@your-server:6379
   ```

**Pros:**
- ✅ Full control
- ✅ Lower cost for high traffic
- ✅ Native Redis protocol
- ✅ Better performance

**Cons:**
- ❌ Requires server management
- ❌ Need to handle scaling yourself

## Installation & Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Generate database migrations:**
   ```bash
   pnpm db:generate
   ```

3. **Run migrations:**
   ```bash
   pnpm db:migrate
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

## Features

### Rate Limiting
- **General rate limit:** 10 requests per hour per IP
- **Waitlist rate limit:** 2 signup attempts per IP
- **Email validation:** Prevents duplicate signups
- **Client-side caching:** Local storage integration

### Database
- **PostgreSQL** with Drizzle ORM
- **Type-safe** database operations
- **Automatic migrations**
- **IP address tracking**

### Redis Usage
- **Rate limiting** (both general and waitlist-specific)
- **Email existence caching** (5 minutes)
- **Stats caching** (10 minutes)
- **Analytics events** (batch processing)

## Troubleshooting

### Redis Connection Issues

**Upstash Redis:**
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check if your Upstash database is active
- Ensure your IP is whitelisted (if configured)

**Traditional Redis:**
- Verify `REDIS_URL` format: `redis://username:password@host:port`
- Check if Redis server is running
- Test connection: `redis-cli -u your_redis_url ping`
- Ensure firewall allows Redis port (usually 6379)

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check if PostgreSQL server is running
- Ensure SSL mode is correct for your provider
- Test connection with a database client

## Examples

### Vercel Deployment
```bash
# Environment variables in Vercel dashboard
USE_UPSTASH=true
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - USE_UPSTASH=false
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=waitlist
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    ports:
      - "5432:5432"
```

### Local Development
```bash
# .env.local
USE_UPSTASH=false
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/waitlist
```