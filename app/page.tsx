'use client';

import { useState, useCallback } from 'react'
import { WaitlistForm } from "../components/waitlist-form"
import { WaitlistStats } from "../components/waitlist-stats"
import { Sparkles } from 'lucide-react'
import "./globals.css"
import { Register } from "../components/register"

export default function Home() {
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)

  const handleEmailSubmitted = useCallback(() => {
    // Trigger stats refresh by updating the key
    console.log('Email submitted, triggering stats refresh...')
    setStatsRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <main className="pb-20 md:pb-0 min-h-screen p-4 max-w-4xl mx-auto max-lg:px-10">
      <div className="space-y-5 pt-20 max-sm:flex max-sm:flex-col max-sm:items-center">
        <div className="space-y-3">
          <div>
            <Register />
          </div>
          <h1 className="text-5xl max-sm:text-center font-semibold">
            Ruklist Waitlist{" "}
          </h1>
          <p className=" max-w-[700px] max-sm:text-center text-md sm:text-lg text-muted-foreground">
            Minimal waitlist is a simple waitlist for SaaS products. It is built with Next.js and Tailwind CSS.
          </p>
        </div>
        <WaitlistForm onEmailSubmitted={handleEmailSubmitted} />
        {/* Stats component with forced visibility */}
        <div className="mt-4">
          <WaitlistStats key={statsRefreshTrigger} />
        </div>
        <div className="pt-10">
          <p className="text-sm font-medium text-muted-foreground">
            Powered with Postgres & Redis by <a href="https://ruklist.com/" target="_blank" className="text-primary font-semibold underline">Ruklist</a>
          </p>
        </div>
      </div>
    </main>
  )
}

const features = [
  {
    title: 'Discord Webhook',
    description: 'Sends a webhook to your discord channel when someone joins the waitlist.',
  },
  {
    title: 'Rate Limit',
    description: 'Rate limits the requests for each IP address for 1 hour.',
  },
  {
    title: 'Fast & Reliable',
    description: 'Built with Next.js and Tailwind CSS and deployed on Zerops.',
  },
]

