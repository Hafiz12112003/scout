import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'

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
      return
    }
    const timeout = setTimeout(async () => {
      setStatus('loading')
      try {
        const data = await api.searchPlayers(query)
        setResults(data.players || [])
        setStatus('done')
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    }, 350)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div className="max-w-6xl mx-auto px-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-20 pb-10"
      >
        <p className="text-data text-xs text-live tracking-widest mb-3">
          GRAPH-POWERED RECRUITMENT INTELLIGENCE
        </p>
        <h1 className="text-display text-5xl md:text-6xl font-semibold text-chalk leading-[0.95] mb-4 max-w-2xl">
          Find the players the market undervalues.
        </h1>
        <p className="text-slate-muted max-w-lg text-base leading-relaxed">
          Clubs overpay when they scout through who they already know. Scout pairs a neural
          value model with a graph of teammates, managers and transfers, so you see who is
          cheap for what they deliver, and the network that leads to them.
        </p>
      </motion.section>

      {stats && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-x-8 gap-y-2 mb-10 pb-6 border-b border-pitch-line"
        >
          <StatBlip value={stats.players} label="PLAYERS TRACKED" />
          <StatBlip value={stats.clubs} label="CLUBS" />
          <StatBlip value={stats.relationships} label="CONNECTIONS" />
          {model?.blend_r2 && <StatBlip value={model.blend_r2} label="VALUE MODEL R²" />}
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-6"
      >
        <div className="dossier-card rounded-lg p-1.5 flex items-center gap-3">
          <span className="text-live text-data text-sm pl-4 select-none">&gt;</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a player — try Yamal, Haaland, Kane..."
            className="flex-1 bg-transparent outline-none py-3 text-chalk placeholder:text-slate-muted text-data text-sm"
          />
          {status === 'loading' && (
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse mr-4" />
          )}
        </div>
      </motion.section>

      <section className="pb-24">
        {status === 'loading' && <LoadingState label="Searching players" />}
        {status === 'error' && <ErrorState message={error} />}
        {status === 'done' && results.length === 0 && (
          <EmptyState
            title="No matches on record"
            hint="Try a different spelling, or search by surname only."
          />
        )}
        {status === 'done' && results.length > 0 && (
          <div className="grid gap-2">
            {results.map((p) => (
              <button
                key={p.name}
                onClick={() => navigate(`/player/${encodeURIComponent(p.name)}`)}
                className="dossier-card rounded-md px-5 py-4 flex items-center justify-between text-left hover:border-live transition-colors group"
              >
                <div>
                  <p className="text-display text-xl text-chalk group-hover:text-floodlight transition-colors">
                    {p.name}
                  </p>
                  <p className="text-sm text-slate-muted">
                    {p.position} · {p.nationality} · b.{p.birth_year}
                  </p>
                </div>
                <p className="text-data text-sm text-live">
                  €{(p.market_value / 1000000).toFixed(0)}M
                </p>
              </button>
            ))}
          </div>
        )}
        {status === 'idle' && (
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <SuggestionCard
              label="HIDDEN GEMS"
              text="Premier League players whose market value sits well below what the model expects"
              onClick={() => navigate('/gems')}
            />
            <SuggestionCard
              label="SCOUTING CHAIN"
              text="Young players linked to a star through shared clubs, ranked by model upside"
              onClick={() => navigate('/explore')}
            />
            <SuggestionCard
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

function StatBlip({ value, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
      <span className="text-display text-2xl text-chalk leading-none">{value}</span>
      <span className="text-data text-[10px] text-slate-muted tracking-widest">{label}</span>
    </div>
  )
}

function SuggestionCard({ label, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="dossier-card rounded-md p-5 text-left hover:border-live transition-colors"
    >
      <p className="text-data text-xs text-floodlight mb-2 tracking-wide">{label}</p>
      <p className="text-sm text-chalk leading-relaxed">{text}</p>
    </button>
  )
}
