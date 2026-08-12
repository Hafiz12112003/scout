import { Link, useLocation } from 'react-router-dom'

export default function TopBar() {
  const location = useLocation()

  return (
    <header className="border-b border-pitch-line sticky top-0 z-20 bg-pitch-night/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <svg width="22" height="22" viewBox="0 0 22 22" className="text-live">
            <circle cx="5" cy="5" r="2.5" fill="currentColor" opacity="0.9" />
            <circle cx="17" cy="6" r="2.5" fill="currentColor" opacity="0.5" />
            <circle cx="11" cy="16" r="2.5" fill="currentColor" opacity="0.9" />
            <line x1="5" y1="5" x2="17" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
            <line x1="5" y1="5" x2="11" y2="16" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
          </svg>
          <span className="text-display text-2xl font-semibold tracking-wide text-chalk">
            SCOUT
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-data">
          <Link
            to="/explore"
            className={`transition-colors ${location.pathname === '/explore' ? 'text-floodlight' : 'text-slate-muted hover:text-chalk'}`}
          >
            EXPLORE
          </Link>
          <Link
            to="/"
            className={`transition-colors ${location.pathname === '/' ? 'text-floodlight' : 'text-slate-muted hover:text-chalk'}`}
          >
            SEARCH
          </Link>
        </nav>
      </div>
    </header>
  )
}
