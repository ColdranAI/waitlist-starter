// Cloudflare Turnstile verification
export interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY not configured')
    return { success: false, error: 'Turnstile not configured' }
  }

  if (!token) {
    return { success: false, error: 'No Turnstile token provided' }
  }

  try {
    console.log('Verifying Turnstile token...')
    
    const formData = new FormData()
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY)
    formData.append('response', token)
    
    if (ip && ip !== 'unknown') {
      formData.append('remoteip', ip)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      console.error('Turnstile API request failed:', response.status)
      return { success: false, error: 'Turnstile verification failed' }
    }

    const result: TurnstileResponse = await response.json()
    
    console.log('Turnstile verification result:', {
      success: result.success,
      errors: result['error-codes'],
      hostname: result.hostname
    })

    if (!result.success) {
      const errorCodes = result['error-codes'] || []
      console.error('Turnstile verification failed:', errorCodes)
      return { 
        success: false, 
        error: `Verification failed: ${errorCodes.join(', ')}` 
      }
    }

    console.log('✅ Turnstile verification successful')
    return { success: true }

  } catch (error) {
    console.error('Turnstile verification error:', error)
    return { 
      success: false, 
      error: 'Turnstile verification service unavailable' 
    }
  }
} 