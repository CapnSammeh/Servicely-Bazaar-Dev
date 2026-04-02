import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CallbackPage() {
  const { storeToken } = useAuth()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      navigate('/', { replace: true })
      return
    }

    async function exchange() {
      try {
        const res = await fetch('/api/github-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json()
        if (data.access_token) {
          storeToken(data.access_token)
          navigate('/', { replace: true })
        } else {
          console.error('OAuth error:', data.error)
          navigate('/?auth_error=1', { replace: true })
        }
      } catch (err) {
        console.error('OAuth exchange failed:', err)
        navigate('/?auth_error=1', { replace: true })
      }
    }

    exchange()
  }, [])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-slate-600 font-medium">Completing sign-in…</p>
    </div>
  )
}
