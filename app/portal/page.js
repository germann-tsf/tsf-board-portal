'use client'

import { useState, useEffect } from 'react'
import Portal from '@/components/Portal'

export default function PortalPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/data')
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(errorBody.details || errorBody.error || 'Failed to fetch data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
          }}>
            Loading...
          </p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#dc2626',
            marginBottom: '0.5rem',
          }}>
            Error Loading Data
          </h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '1rem',
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {data?._debug && (
        <div style={{ margin: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <strong>BOARD MEMBER DEBUG:</strong><br />
          {JSON.stringify(data._debug, null, 2)}
        </div>
      )}
      <Portal
        meetings={data?.meetings || []}
        boardMembers={data?.boardMembers || []}
        actionPlan={data?.actionPlan || []}
        foundationalDocs={data?.foundationalDocs || []}
      />
    </>
  )
}
