import { Link, useLocation } from 'react-router-dom'
import Ticker from './Ticker'

const LINKS = [
  { to: '/gems', label: 'GEMS' },
  { to: '/ask', label: 'ASK' },
  { to: '/reach', label: 'REACH' },
  { to: '/explore', label: 'EXPLORE' },
  { to: '/', label: 'SEARCH' },
]

export default function TopBar() {
  const { pathname } = useLocation()
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  return (
    <header className="sticky top-0 z-20 bg-ink/90 backdrop-blur border-b border-edge">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Scout home">
          <span className="slant bg-volt text-ink px-3.5 py-1 inline-block">
            <span className="unslant text-display text-2xl leading-none">SCOUT</span>
          </span>
          <span className="hidden sm:block text-data text-[10px] tracking-[0.22em] text-mute leading-tight">
            GRAPH
            <br />
            INTEL
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" aria-label="Main">
          {LINKS.map((l) => {
            const active = isActive(l.to)
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={active ? 'page' : undefined}
                className={`slant px-4 py-1.5 border text-data text-xs tracking-wider transition-colors ${
                  active
                    ? 'bg-volt text-ink border-volt font-semibold'
                    : 'border-edge text-mute hover:text-chalk hover:border-mute'
                }`}
              >
                <span className="unslant">{l.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      <Ticker />
    </header>
  )
}