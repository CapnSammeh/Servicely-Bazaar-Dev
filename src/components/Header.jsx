import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { user, login, logout } = useAuth()

  return (
    <header className="bg-[#0f172a] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center font-bold text-white text-lg select-none">
              S
            </div>
            <span className="font-semibold text-lg tracking-tight group-hover:text-blue-400 transition-colors">
              Servicely <span className="text-blue-400">Bazaar</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-300 hover:text-white transition-colors'
              }
              end
            >
              Browse
            </NavLink>
            {user && (
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-300 hover:text-white transition-colors'
                }
              >
                Upload
              </NavLink>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/upload" className="sm:hidden text-slate-300 hover:text-white text-sm">
                  Upload
                </Link>
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-8 h-8 rounded-full ring-2 ring-slate-600"
                  />
                  <span className="hidden sm:block text-sm text-slate-300">
                    {user.login}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-slate-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
