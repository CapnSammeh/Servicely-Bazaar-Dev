import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGitHub } from '../hooks/useGitHub'
import { useAuth } from '../hooks/useAuth'
import { REPO_OWNER, REPO_NAME } from '../config'
import VersionList from '../components/VersionList'
import Comments from '../components/Comments'
import LoadingSpinner from '../components/LoadingSpinner'

const CATEGORY_COLORS = {
  Integrations: 'bg-purple-100 text-purple-700',
  Workflows: 'bg-blue-100 text-blue-700',
  Forms: 'bg-green-100 text-green-700',
  Reports: 'bg-amber-100 text-amber-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-slate-100 text-slate-600',
}

export default function ItemPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { fetchManifest, fetchVersionFile, downloadFile } = useGitHub()
  const { user, isAdmin } = useAuth()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchManifest(slug)
      .then(setItem)
      .catch(() => setError('Item not found or could not be loaded.'))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleDownloadLatest() {
    if (!item) return
    setDownloading(true)
    try {
      const latestVer = item.versions.find((v) => v.version === item.latestVersion) || item.versions[0]
      const content = await fetchVersionFile(item.id, latestVer.path)
      downloadFile(`${item.id}-v${latestVer.version}.xml`, content)
    } catch (err) {
      alert('Download failed: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600 font-medium mb-2">{error || 'Item not found'}</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          Back to marketplace
        </Link>
      </div>
    )
  }

  const isOwner = user?.login === item.author
  const canSeeItem = isAdmin || isOwner || item.status === 'approved'

  if (!canSeeItem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600 font-medium mb-2">Item not found</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">Back to marketplace</Link>
      </div>
    )
  }

  const categoryStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other
  const initials = item.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/" className="hover:text-blue-600 transition-colors">Marketplace</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-700 font-medium">{item.name}</span>
      </nav>

      {/* Review status banners */}
      {item.status === 'pending' && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Pending review</p>
            <p className="text-sm text-amber-700 mt-0.5">
              This item is awaiting approval from a marketplace admin before it becomes publicly visible.
            </p>
          </div>
        </div>
      )}
      {item.status === 'rejected' && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Submission rejected</p>
            {item.reviewNote && (
              <p className="text-sm text-red-700 mt-0.5">{item.reviewNote}</p>
            )}
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-xl bg-[#0f172a] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryStyle}`}>
                  {item.category}
                </span>
              </div>

              <p className="text-slate-600 mb-4 leading-relaxed">{item.description}</p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <a
                    href={`https://github.com/${item.author}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    {item.author}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>v{item.latestVersion}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Download CTA */}
            <div className="flex-shrink-0">
              <button
                onClick={handleDownloadLatest}
                disabled={downloading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Downloading…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Latest
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 mt-1.5 text-center">v{item.latestVersion} · XML</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Version history */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <VersionList
              item={item}
              onVersionUploaded={(updated) => setItem(updated)}
            />
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <Comments issueNumber={item.issueNumber} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Versions</dt>
                <dd className="font-medium text-slate-900">{item.versions?.length || 1}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Latest</dt>
                <dd className="font-medium text-slate-900">v{item.latestVersion}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">{item.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">ID</dt>
                <dd className="font-mono text-xs text-slate-600">{item.id}</dd>
              </div>
            </dl>
          </div>

          {/* GitHub links */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Links</h3>
            <div className="space-y-2">
              <a
                href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/main/marketplace/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                View source on GitHub
              </a>
              {item.issueNumber && (
                <a
                  href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${item.issueNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Discussion thread
                </a>
              )}
            </div>
          </div>

          {/* Author card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Author</h3>
            <a
              href={`https://github.com/${item.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <img
                src={`https://github.com/${item.author}.png?size=64`}
                alt={item.author}
                className="w-10 h-10 rounded-full ring-1 ring-slate-200"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.author}
                </p>
                <p className="text-xs text-slate-400">GitHub profile</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
