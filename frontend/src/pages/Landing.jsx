import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'
import { StatTile, Stripes, Tile } from '../components/ui'
import { euro } from '../lib/format'

export default function Landing() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [model, setModel] = useState(null)

  useEffect(() => {
    api.getGraphStats().then(setStats).catch(() => setStats(null))
    api.modelCard().then(setModel).catch(() => setModel(null))
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setStatus('idle')
      return undefined
    }
    let alive = true
    const timeout = setTimeout(async () => {
      setStatus('loading')
      try {
        const data = await api.searchPlayers(query)
        if (!alive) return
        setResults(data.players || [])
        setStatus('done')
      } catch (e) {
        if (!alive) return
        setError(e.message)
        setStatus('error')
      }
    }, 350)
    return () => {
      alive = false
      clearTimeout(timeout)
    }
  }, [query])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <section className="pt-14 sm:pt-20 pb-10">
        <p className="reveal text-data text-xs text-volt tracking-[0.22em] mb-4">
          GRAPH-POWERED RECRUITMENT INTELLIGENCE
        </p>
        <h1
          className="reveal text-display text-6xl sm:text-7xl md:text-8xl text-chalk leading-[0.9] max-w-4xl"
          style={{ '--i': 1 }}
        >
          Find the players the market <span className="text-volt">undervalues.</span>
        </h1>
        <Stripes className="reveal h-2 w-40 mt-6" />
        <p className="reveal text-mute max-w-xl text-base leading-relaxed mt-6" style={{ '--i': 2 }}>
          Clubs overpay when they scout through who they already know. Scout pairs a neural value model with a graph
          of teammates, managers and transfers, so you see who is cheap for what they deliver, and the network that
          leads to them.
        </p>
      </section>

      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatTile index={0} value={stats.players} label="PLAYERS TRACKED" />
          <StatTile index={1} value={stats.clubs} label="CLUBS" />
          <StatTile index={2} value={stats.relationships} label="CONNECTIONS" />
          {model?.blend_r2 && <StatTile index={3} value={model.blend_r2} decimals={3} label="VALUE MODEL R2" />}
        </section>
      )}

      <section className="mb-6 reveal" style={{ '--i': 3 }}>
        <label htmlFor="player-search" className="sr-only">
          Search a player
        </label>
        <div className="tile tile-accent flex items-center gap-3 pl-5 pr-2 focus-within:border-volt transition-colors">
          <span className="text-volt text-data text-sm select-none" aria-hidden="true">
            &gt;
          </span>
          <input
            id="player-search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a player - try Yamal, Haaland, Kane..."
            className="flex-1 bg-transparent outline-none py-4 text-chalk placeholder:text-mute text-data text-sm"
          />
          {status === 'loading' && (
            <span className="w-2 h-2 bg-volt animate-pulse mr-4" style={{ transform: 'skewX(-12deg)' }} />
          )}
        </div>
      </section>

      <section className="pb-24">
        {status === 'loading' && <LoadingState label="Searching players" />}
        {status === 'error' && <ErrorState message={error} />}
        {status === 'done' && results.length === 0 && (
          <EmptyState title="No matches on record" hint="Try a different spelling, or search by surname only." />
        )}
        {status === 'done' && results.length > 0 && (
          <div className="grid gap-2.5">
            {results.map((p, i) => (
              <button
                key={p.name}
                onClick={() => navigate(`/player/${encodeURIComponent(p.name)}`)}
                className="tile reveal w-full px-5 py-4 flex items-center justify-between text-left hover:bg-panel2 hover:border-volt transition-colors group"
                style={{ '--i': Math.min(i, 8) }}
              >
                <div className="min-w-0">
                  <p className="text-display text-2xl text-chalk group-hover:text-volt transition-colors truncate leading-tight">
                    {p.name}
                  </p>
                  <p className="text-data text-[11px] tracking-wider text-mute uppercase">
                    {p.position} / {p.nationality} / b.{p.birth_year}
                  </p>
                </div>
                <p className="text-display text-3xl text-chalk shrink-0 pl-4">{euro(p.market_value)}</p>
              </button>
            ))}
          </div>
        )}
        {status === 'idle' && (
          <div className="grid md:grid-cols-3 gap-3 mt-8">
            <Suggestion
              index={0}
              label="HIDDEN GEMS"
              text="Premier League players whose market value sits well below what the model expects"
              onClick={() => navigate('/gems')}
            />
            <Suggestion
              index={1}
              label="SCOUTING CHAIN"
              text="Young players linked to a star through shared clubs, ranked by model upside"
              onClick={() => navigate('/explore')}
            />
            <Suggestion
              index={2}
              label="SHORTEST PATH"
              text="Degrees of separation between any two players, traced through clubs"
              onClick={() => navigate('/explore')}
            />
          </div>
        )}
      </section>
    </div>
  )
}

function Suggestion({ label, text, onClick, index }) {
  return (
    <button
      onClick={onClick}
      className="tile reveal p-5 text-left hover:bg-panel2 hover:border-volt transition-colors flex flex-col"
      style={{ '--i': index + 4 }}
    >
      <Stripes className="h-1 w-12 mb-3" />
      <p className="text-display text-2xl text-chalk mb-2">{label}</p>
      <p className="text-sm text-mute leading-relaxed">{text}</p>
    </button>
  )
}