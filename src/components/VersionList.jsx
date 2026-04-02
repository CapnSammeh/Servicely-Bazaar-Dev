import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGitHub } from '../hooks/useGitHub'
import UploadVersionModal from './UploadVersionModal'

export default function VersionList({ item, onVersionUploaded }) {
  const { user, isAdmin } = useAuth()
  const { fetchVersionFile, downloadFile } = useGitHub()
  const [downloading, setDownloading] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const sorted = [...(item.versions || [])].sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  )

  async function handleDownload(ver) {
    setDownloading(ver.version)
    try {
      const content = await fetchVersionFile(item.id, ver.path)
      downloadFile(`${item.id}-v${ver.version}.xml`, content)
    } catch (err) {
      alert('Download failed: ' + err.message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Version History</h2>
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload New Version
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map((ver, idx) => {
          const isPending = ver.status === 'pending'
          const isRejected = ver.status === 'rejected'
          const isLatest = ver.version === item.latestVersion
          const canDownload = !isPending || isAdmin || user?.login === item.author

          return (
            <div
              key={ver.version}
              className={`flex items-start justify-between p-4 rounded-lg border ${
                isPending
                  ? 'border-amber-200 bg-amber-50'
                  : isRejected
                  ? 'border-red-200 bg-red-50'
                  : isLatest
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">v{ver.version}</span>
                  {isLatest && !isPending && !isRejected && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                      Latest
                    </span>
                  )}
                  {isPending && (
                    <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-medium">
                      Pending Review
                    </span>
                  )}
                  {isRejected && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                      Rejected
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(ver.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {ver.notes && (
                  <p className="text-sm text-slate-600 line-clamp-2">{ver.notes}</p>
                )}
                {isRejected && ver.reviewNote && (
                  <p className="text-xs text-red-600 mt-1 italic">{ver.reviewNote}</p>
                )}
              </div>
              {canDownload ? (
                <button
                  onClick={() => handleDownload(ver)}
                  disabled={downloading === ver.version}
                  className="ml-4 flex-shrink-0 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {downloading === ver.version ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Downloading…
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              ) : (
                <span className="ml-4 flex-shrink-0 text-xs text-amber-600 font-medium px-3 py-1.5">
                  Awaiting approval
                </span>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <UploadVersionModal
          item={item}
          onClose={() => setShowModal(false)}
          onSuccess={(updated) => {
            setShowModal(false)
            onVersionUploaded?.(updated)
          }}
        />
      )}
    </div>
  )
}
