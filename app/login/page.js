'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        router.push('/portal')
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#faf8f5',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#6B1D38',
        padding: '2.5rem 1rem 2rem',
        textAlign: 'center',
        borderBottom: '4px solid #D4A843',
      }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: '600',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#D4A843',
          marginBottom: '0.75rem',
        }}>
          Thaddeus Stevens Foundation
        </div>
        <h1 style={{
          color: 'white',
          fontSize: '2rem',
          fontWeight: '700',
          margin: '0 0 0.5rem 0',
        }}>
          Board Portal
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem',
          margin: 0,
        }}>
          The Shelter Forum, Inc.
        </p>
      </div>

      {/* Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(107, 29, 56, 0.08)',
          padding: '2rem',
          border: '1px solid #e8e0d8',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#2A3D5C',
          }}>
            Board Member Login
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#374151',
              }}>
                Portal Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '0.375rem',
                color: '#dc2626',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#6B1D38',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '1.5rem',
          }}>
            Contact Jenny Germann for access
          </p>
        </div>
      </div>
    </div>
  )
}
