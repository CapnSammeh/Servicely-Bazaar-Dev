import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGitHub } from '../hooks/useGitHub'
import ItemCard, { ItemCardSkeleton } from '../components/ItemCard'
import { Link, useSearchParams } from 'react-router-dom'

const CATEGORIES = ['All', 'Integrations', 'Workflows', 'Forms', 'Reports', 'Utilities', 'Other']
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
]

export default function HomePage() {
  const { user, login, isAdmin } = useAuth()
  const { fetchAllItems } = useGitHub()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('q') || ''
  const category = searchParams.get('cat') || 'All'
  const sort = searchParams.get('sort') || 'newest'

  function setParam(key, value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'All' && value !== 'newest') {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchAllItems()
      .then(setItems)
      .catch((err) => {
        if (err.status === 404) {
          setItems([])
        } else {
          setError('Could not load marketplace items. Check your repository configuration.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      // Admins see everything
      if (isAdmin) return true
      // Authors see their own items regardless of status
      if (user && i.author === user.login) return true
      // Everyone else only sees approved items
      return i.status === 'approved'
    })

    if (category !== 'All') {
      result = result.filter((i) => i.category === category)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q)) ||
          i.author?.toLowerCase().includes(q)
      )
    }

    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [items, search, category, sort])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Servicely <span className="text-blue-600">Bazaar</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Discover, share, and download Change Sets for Servicely. Browse the community marketplace or contribute your own.
        </p>
        {!user && (
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={login}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in to contribute
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Learn more
            </a>
          </div>
        )}
        {user && (
          <div className="mt-6">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload Change Set
            </Link>
          </div>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search by name, tag, or author…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setParam('cat', cat)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.994L13.732 4c-.77-1.327-2.694-1.327-3.464 0L3.34 16.006C2.57 17.333 3.532 19 5.072 19z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-1">Could not load items</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-1">
            {items.length === 0 ? 'No items in the marketplace yet' : 'No items match your search'}
          </p>
          <p className="text-slate-400 text-sm mb-5">
            {items.length === 0
              ? 'Be the first to upload a Change Set!'
              : 'Try adjusting your search or filters.'}
          </p>
          {items.length === 0 && user && (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Upload the first item
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            {category !== 'All' && ` in ${category}`}
            {search && ` matching "${search}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
