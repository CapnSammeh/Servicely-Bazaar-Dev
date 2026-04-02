import { useState, useRef } from 'react'
import { useGitHub } from '../hooks/useGitHub'

export default function UploadVersionModal({ item, onClose, onSuccess }) {
  const { uploadNewVersion } = useGitHub()
  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (f && !f.name.endsWith('.xml')) {
      setError('Only XML files are accepted.')
      fileRef.current.value = ''
      return
    }
    setError('')
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!version.trim()) return setError('Version number is required.')
    if (!file) return setError('Please select an XML file.')

    // Check version doesn't already exist
    const exists = item.versions?.some((v) => v.version === version.trim())
    if (exists) return setError(`Version ${version} already exists.`)

    setSubmitting(true)
    try {
      const xmlContent = await file.text()
      const updated = await uploadNewVersion({
        slug: item.id,
        version: version.trim(),
        notes: notes.trim(),
        xmlContent,
      })
      onSuccess(updated)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload New Version</h2>
            <p className="text-sm text-slate-500 mt-0.5">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Version Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder={`e.g. ${item.latestVersion ? bumpVersion(item.latestVersion) : '1.1.0'}`}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Current latest: v{item.latestVersion}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Release Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What changed in this version?"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              XML File <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {file.name}
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-600">Click to select or drag & drop</p>
                  <p className="text-xs text-slate-400 mt-1">.xml files only</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xml,application/xml,text/xml"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                'Upload Version'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function bumpVersion(ver) {
  const parts = ver.split('.').map(Number)
  parts[2] = (parts[2] || 0) + 1
  return parts.join('.')
}
