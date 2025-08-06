'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { joinWaitlist } from '../app/actions'
import { ClientUtils } from '../lib/client-utils'

interface WaitlistFormProps {
    onEmailSubmitted?: () => void
}

export function WaitlistForm({ onEmailSubmitted }: WaitlistFormProps) {
    const [status, setStatus] = useState<{
        message?: string
        success?: boolean
    }>({})
    const [isPending, setIsPending] = useState(false)
    const [email, setEmail] = useState('')
    const [hasSignedUp, setHasSignedUp] = useState(false)

    // Check if user has already signed up on component mount
    useEffect(() => {
        // Only check localStorage on mount for logging, don't change UI state
        const state = ClientUtils.getSignupState()
        if (state) {
            console.log('Found existing signup state:', state.email)
            // Don't automatically show success state - only show it after form submission
        }
    }, [])

    async function handleSubmit(formData: FormData) {
        const emailValue = formData.get('email') as string
        
        // Check if user has already successfully signed up with this email
        if (ClientUtils.hasSuccessfullySignedUp(emailValue)) {
            setStatus({
                success: false,
                message: `You've already successfully signed up with ${emailValue}. Check your email for updates!`
            })
            return
        }

        // Check if user has exceeded attempt limits
        if (ClientUtils.hasExceededAttempts(emailValue, 3)) {
            setStatus({
                success: false,
                message: 'You have exceeded the maximum number of signup attempts. Please try again later.'
            })
            return
        }

        setIsPending(true)
        
        const response = await joinWaitlist(formData)
        setStatus(response)
        setIsPending(false)
        
        if (response.success) {
            // Mark as successfully signed up (separate from attempts tracking)
            ClientUtils.markAsSuccessfullySignedUp(emailValue)
            setHasSignedUp(true)
            setEmail(emailValue)
            
            // Trigger stats refresh with a small delay to ensure DB consistency
            setTimeout(() => {
                onEmailSubmitted?.()
            }, 500)
        } else {
            // Only increment attempts on FAILED attempts (after server validation)
            ClientUtils.incrementAttempts(emailValue)
        }
    }

    // Success state - show when user successfully joined
    if (hasSignedUp && status.success) {
        return (
            <div className="max-w-lg space-y-4">
                <div className="border rounded-lg p-6 bg-white/50 backdrop-blur-sm">
                    <div className="text-center space-y-4">
                        <div className="p-4 rounded-lg text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                            {status.message || `🎉 You're on the waitlist with ${email}!`}
                        </div>
                        <br />
                        <br />
                        {/* Discord/Community Button */}
                        {process.env.NEXT_PUBLIC_DISCORD_INVITE && (
                            <div className="pt-2 space-y-2">
                                <p className="text-sm text-gray-600">Join our Discord server</p>
                                <a 
                                    href={process.env.NEXT_PUBLIC_DISCORD_INVITE} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                    Join Discord
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md space-y-4">
            <div className="border rounded-lg p-1.5 bg-white/50 backdrop-blur-sm">
                <form action={handleSubmit} className="flex space-x-3">
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        required
                        className="flex-1 px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                    />
                    <button 
                        type="submit" 
                        disabled={isPending}
                        className="px-4 py-1.5 bg-neutral-900 border-2 border-neutral-500 hover:bg-neutral-800 text-white font-semibold rounded-lg text-sm"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                Joining...
                            </>
                        ) : (
                            'Join Waitlist'
                        )}
                    </button>
                </form>
            </div>


            {status.message && (
                <div className="space-y-4">
                    <div
                        className={`p-4 rounded-lg text-sm font-medium ${
                            status.success 
                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                    >
                        {status.message}
                    </div>

                </div>
            )}
        </div>
    )
}

