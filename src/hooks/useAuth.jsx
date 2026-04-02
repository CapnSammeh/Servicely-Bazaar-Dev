import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Octokit } from '@octokit/rest'
import { GITHUB_CLIENT_ID, REPO_OWNER, REPO_NAME } from '../config'

const AuthContext = createContext(null)

const TOKEN_KEY = 'sb_github_token'
const USER_KEY = 'sb_github_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Fetch user profile when token changes
  useEffect(() => {
    if (token && !user) {
      setLoading(true)
      const octokit = new Octokit({ auth: token })
      octokit.rest.users
        .getAuthenticated()
        .then(({ data }) => {
          setUser(data)
          localStorage.setItem(USER_KEY, JSON.stringify(data))
          // Check collaborator status
          return octokit.rest.repos
            .checkCollaborator({ owner: REPO_OWNER, repo: REPO_NAME, username: data.login })
            .then(() => setIsAdmin(true))
            .catch(() => setIsAdmin(false))
        })
        .catch(() => {
          // Token is invalid — clear it
          logout()
        })
        .finally(() => setLoading(false))
    }
  }, [token])

  const login = useCallback(() => {
    const redirectUri = encodeURIComponent(window.location.origin + '/callback')
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=public_repo&redirect_uri=${redirectUri}`
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setIsAdmin(false)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const storeToken = useCallback((newToken) => {
    setToken(newToken)
    localStorage.setItem(TOKEN_KEY, newToken)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, login, logout, storeToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
