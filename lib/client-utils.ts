// Client-side utilities for managing waitlist signup state

const STORAGE_KEY = 'waitlist_signup_state'

interface SignupState {
  email: string
  timestamp: number
  attempts: number
}

export class ClientUtils {
  // Check if user has already signed up with this email
  static hasSignedUp(email: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      
      const state: SignupState = JSON.parse(stored)
      return state.email.toLowerCase() === email.toLowerCase()
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return false
    }
  }

  // Mark email as signed up
  static markAsSignedUp(email: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const state: SignupState = {
        email: email.toLowerCase(),
        timestamp: Date.now(),
        attempts: 1
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }

  // Increment attempt count
  static incrementAttempts(email: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let state: SignupState
      
      if (stored) {
        state = JSON.parse(stored)
        if (state.email.toLowerCase() === email.toLowerCase()) {
          state.attempts += 1
          state.timestamp = Date.now()
        } else {
          state = {
            email: email.toLowerCase(),
            timestamp: Date.now(),
            attempts: 1
          }
        }
      } else {
        state = {
          email: email.toLowerCase(),
          timestamp: Date.now(),
          attempts: 1
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error updating localStorage:', error)
    }
  }

  // Get current signup state
  static getSignupState(): SignupState | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  // Clear signup state (for testing or reset)
  static clearSignupState(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  // Check if user has exceeded attempt limit (client-side check)
  static hasExceededAttempts(email: string, maxAttempts: number = 3): boolean {
    const state = this.getSignupState()
    if (!state) return false
    
    // Check if it's been more than 1 hour since last attempt
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    if (state.timestamp < oneHourAgo) {
      // Reset attempts if it's been more than an hour
      this.clearSignupState()
      return false
    }
    
    return state.email.toLowerCase() === email.toLowerCase() && state.attempts >= maxAttempts
  }

  // Check if user has already successfully signed up (different from attempts)
  static hasSuccessfullySignedUp(email: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const successKey = `waitlist_success_${email.toLowerCase()}`
      const success = localStorage.getItem(successKey)
      return success === 'true'
    } catch (error) {
      console.error('Error checking success state:', error)
      return false
    }
  }

  // Mark email as successfully signed up (separate from attempts)
  static markAsSuccessfullySignedUp(email: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const successKey = `waitlist_success_${email.toLowerCase()}`
      localStorage.setItem(successKey, 'true')
    } catch (error) {
      console.error('Error marking success state:', error)
    }
  }
} 