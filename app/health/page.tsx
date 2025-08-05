'use client'

import { useState, useEffect } from 'react'
import { healthCheck } from '../actions'

export default function HealthPage() {
  const [healthData, setHealthData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      try {
        const result = await healthCheck()
        setHealthData(result)
      } catch (error) {
        setHealthData({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">System Health Check</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">System Health Check</h1>
      
      <div className={`p-4 rounded-lg border ${
        healthData?.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <h2 className="text-lg font-semibold mb-2">
          Status: {healthData?.success ? '✅ Healthy' : '❌ Error'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Timestamp:</h3>
            <p className="text-sm text-gray-600">{healthData?.timestamp}</p>
          </div>

          {healthData?.environment && (
            <div>
              <h3 className="font-medium">Environment Variables:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(healthData.environment, null, 2)}
              </pre>
            </div>
          )}

          {healthData?.services && (
            <div>
              <h3 className="font-medium">Services:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(healthData.services, null, 2)}
              </pre>
            </div>
          )}

          {healthData?.error && (
            <div>
              <h3 className="font-medium">Error:</h3>
              <p className="text-sm text-red-600">{healthData.error}</p>
            </div>
          )}

          {healthData?.stack && (
            <div>
              <h3 className="font-medium">Stack Trace:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {healthData.stack}
              </pre>
            </div>
          )}

          <div>
            <h3 className="font-medium">Full Response:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Health Check
        </button>
      </div>
    </div>
  )
} 