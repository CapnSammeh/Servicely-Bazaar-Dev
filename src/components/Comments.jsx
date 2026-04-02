import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGitHub } from '../hooks/useGitHub'
import { REPO_OWNER, REPO_NAME } from '../config'
import LoadingSpinner from './LoadingSpinner'

/** Very simple markdown renderer — handles bold, italic, inline code, links, newlines */
function SimpleMarkdown({ text }) {
  if (!text) return null
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
    .replace(/\n/g, '<br />')

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function Comments({ issueNumber }) {
  const { user, login } = useAuth()
  const { fetchIssueComments, postIssueComment } = useGitHub()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  useEffect(() => {
    if (!issueNumber) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchIssueComments(issueNumber)
      .then(setComments)
      .catch(() => setError('Could not load comments.'))
      .finally(() => setLoading(false))
  }, [issueNumber])

  async function handlePost(e) {
    e.preventDefault()
    if (!body.trim()) return
    setPosting(true)
    setPostError('')
    try {
      const comment = await postIssueComment(issueNumber, body.trim())
      setComments((prev) => [...prev, comment])
      setBody('')
    } catch (err) {
      setPostError(err.message || 'Failed to post comment.')
    } finally {
      setPosting(false)
    }
  }

  const issueUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500">({comments.length})</span>
          )}
        </h2>
        {issueNumber && (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View on GitHub
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No comments yet. Be the first to leave one!</p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <a
                href={comment.user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src={comment.user.avatar_url}
                  alt={comment.user.login}
                  className="w-8 h-8 rounded-full ring-1 ring-slate-200"
                />
              </a>
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={comment.user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {comment.user.login}
                    </a>
                    <span className="text-xs text-slate-400">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <SimpleMarkdown text={comment.body} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post comment */}
      {issueNumber && (
        <div className="border-t border-slate-100 pt-5">
          {user ? (
            <form onSubmit={handlePost} className="flex gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-8 h-8 rounded-full ring-1 ring-slate-200 flex-shrink-0 mt-1"
              />
              <div className="flex-1">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Leave a comment…"
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {postError && (
                  <p className="text-xs text-red-500 mt-1">{postError}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={posting || !body.trim()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    {posting ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Posting…
                      </>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4 text-center">
              <p className="text-sm text-slate-600 mb-3">Sign in to leave a comment</p>
              <button
                onClick={login}
                className="inline-flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in with GitHub
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
