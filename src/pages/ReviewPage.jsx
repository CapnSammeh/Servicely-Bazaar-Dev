import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useGitHub } from '../hooks/useGitHub'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReviewPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const { fetchAllItems, approveVersion, rejectVersion } = useGitHub()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState({}) // { [key]: 'approving' | 'rejecting' | 'done' }
  const [rejectModal, setRejectModal] = useState(null) // { slug, version, name }
  const [rejectNote, setRejectNote] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAdmin) {
      navigate('/')
      return
    }
    load()
  }, [isAdmin, authLoading])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const all = await fetchAllItems()
      setItems(all)
    } catch (err) {
      if (err.status === 404) {
        setItems([])
      } else {
        setError('Could not load items.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Items where the item itself is pending (new submissions)
  const pendingItems = items.filter((i) => i.status === 'pending')

  // Approved items that have pending versions
  const pendingVersions = items
    .filter((i) => i.status === 'approved')
    .flatMap((i) =>
      (i.versions || [])
        .filter((v) => v.status === 'pending')
        .map((v) => ({ item: i, version: v }))
    )

  const totalPending = pendingItems.length + pendingVersions.length

  async function handleApprove(slug, version) {
    const key = `${slug}@${version}`
    setActionState((s) => ({ ...s, [key]: 'working' }))
    try {
      await approveVersion(slug, version)
      await load()
    } catch (err) {
      alert('Failed to approve: ' + err.message)
    } finally {
      setActionState((s) => ({ ...s, [key]: undefined }))
    }
  }

  function openRejectModal(slug, version, name) {
    setRejectModal({ slug, version, name })
    setRejectNote('')
  }

  async function handleReject() {
    if (!rejectModal) return
    const { slug, version } = rejectModal
    const key = `${slug}@${version}`
    setActionState((s) => ({ ...s, [key]: 'working' }))
    setRejectModal(null)
    try {
      await rejectVersion(slug, version, rejectNote || undefined)
      await load()
    } catch (err) {
      alert('Failed to reject: ' + err.message)
    } finally {
      setActionState((s) => ({ ...s, [key]: undefined }))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Review Queue</h1>
        <p className="text-slate-500 text-sm">
          {totalPending === 0
            ? 'No pending submissions — all caught up.'
            : `${totalPending} submission${totalPending !== 1 ? 's' : ''} awaiting review`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New item submissions */}
      {pendingItems.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            New Items ({pendingItems.length})
          </h2>
          <div className="space-y-4">
            {pendingItems.map((item) => {
              const firstVersion = item.versions?.[0]
              const key = `${item.id}@${firstVersion?.version}`
              const working = actionState[key] === 'working'
              return (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          to={`/item/${item.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          v{firstVersion?.version}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <a
                          href={`https://github.com/${item.author}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <img
                            src={`https://github.com/${item.author}.png?size=32`}
                            alt={item.author}
                            className="w-4 h-4 rounded-full"
                          />
                          {item.author}
                        </a>
                        <span>·</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {firstVersion?.notes && (
                        <p className="text-xs text-slate-500 mt-2 italic">
                          Release notes: {firstVersion.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(item.id, firstVersion?.version)}
                        disabled={working}
                        className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-500 disabled:bg-green-400 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {working ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(item.id, firstVersion?.version, item.name)}
                        disabled={working}
                        className="flex items-center gap-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Pending versions on already-approved items */}
      {pendingVersions.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            New Versions ({pendingVersions.length})
          </h2>
          <div className="space-y-4">
            {pendingVersions.map(({ item, version: ver }) => {
              const key = `${item.id}@${ver.version}`
              const working = actionState[key] === 'working'
              return (
                <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          to={`/item/${item.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          v{ver.version}
                        </span>
                        <span className="text-xs text-slate-400">
                          (currently v{item.latestVersion})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                        <a
                          href={`https://github.com/${item.author}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <img
                            src={`https://github.com/${item.author}.png?size=32`}
                            alt={item.author}
                            className="w-4 h-4 rounded-full"
                          />
                          {item.author}
                        </a>
                        <span>·</span>
                        <span>
                          {new Date(ver.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {ver.notes && (
                        <p className="text-sm text-slate-600 italic">"{ver.notes}"</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(item.id, ver.version)}
                        disabled={working}
                        className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-500 disabled:bg-green-400 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {working ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(item.id, ver.version, item.name)}
                        disabled={working}
                        className="flex items-center gap-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {totalPending === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">All caught up</p>
          <p className="text-slate-400 text-sm mt-1">No items are pending review.</p>
        </div>
      )}

      {/* Reject confirmation modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Reject submission</h3>
            <p className="text-sm text-slate-500 mb-4">
              Rejecting <strong>{rejectModal.name}</strong> v{rejectModal.version}. Optionally add a note for the author.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="text-sm bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
