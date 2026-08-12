import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'

const TABS = [
  { id: 'chain', label: 'SCOUTING CHAIN' },
  { id: 'path', label: 'SHORTEST PATH' },
  { id: 'lineage', label: 'MANAGER LINEAGE' },
]

export default function Explore() {
  const location = useLocation()
  const preset = location.state?.presetPlayer || ''
  const [tab, setTab] = useState('chain')

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24">
      <section className="pt-12 pb-8">
        <p className="text-data text-xs text-live tracking-widest mb-2">GRAPH QUERIES</p>
        <h1 className="text-display text-5xl font-semibold text-chalk mb-3">
          Run the traversals.
        </h1>
        <p className="text-slate-muted max-w-xl">
          These are the questions a relational database makes painful. Here, they're a graph pattern.
        </p>
      </section>

      <div className="flex gap-1 mb-8 border-b border-pitch-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-data text-xs tracking-wide transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-floodlight border-floodlight'
                : 'text-slate-muted border-transparent hover:text-chalk'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'chain' && <ScoutingChainPanel presetPlayer={preset} />}
      {tab === 'path' && <ShortestPathPanel />}
      {tab === 'lineage' && <ManagerLineagePanel />}
    </div>
  )
}

function ScoutingChainPanel({ presetPlayer }) {
  const [player, setPlayer] = useState(presetPlayer)
  const [targetClub, setTargetClub] = useState('Paris Saint-Germain')
  const [maxAge, setMaxAge] = useState(25)
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const run = async () => {
    if (!player || !targetClub) return
    setStatus('loading')
    try {
      const data = await api.scoutingChain(player, targetClub, maxAge)
      setResults(data.candidates || [])
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <p className="text-sm text-slate-muted mb-5 max-w-2xl">
        Finds players who were teammates of <span className="text-chalk">Player</span> at any club,
        are under the age cutoff, and share an agent with someone already transferred to{' '}
        <span className="text-chalk">Target Club</span>. A 3-hop traversal.
      </p>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Field label="PLAYER" value={player} onChange={setPlayer} placeholder="Jude Bellingham" />
        <Field label="TARGET CLUB" value={targetClub} onChange={setTargetClub} placeholder="Paris Saint-Germain" />
        <Field label="MAX AGE" value={maxAge} onChange={setMaxAge} type="number" />
        <button
          onClick={run}
          className="self-end bg-live hover:bg-live-dim transition-colors text-pitch-night font-medium rounded-md py-3 text-data text-sm"
        >
          RUN QUERY
        </button>
      </div>

      {status === 'loading' && <LoadingState label="Traversing 3 hops" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'done' && results.length === 0 && (
        <EmptyState title="No candidates found" hint="Try a different player or target club — the graph may not connect them." />
      )}
      {status === 'done' && results.length > 0 && (
        <div className="grid gap-2">
          {results.map((c, i) => (
            <div key={i} className="dossier-card rounded-md px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-chalk font-medium">{c.name}</p>
                <p className="text-sm text-slate-muted text-data">
                  {c.position} · b.{c.birth_year} · agent: {c.agent_name}
                </p>
              </div>
              <p className="text-data text-sm text-live">€{(c.market_value / 1000000).toFixed(0)}M</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ShortestPathPanel() {
  const [playerA, setPlayerA] = useState('Cristiano Ronaldo')
  const [playerB, setPlayerB] = useState('Erling Haaland')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const run = async () => {
    setStatus('loading')
    try {
      const data = await api.shortestPath(playerA, playerB)
      setResult(data)
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <p className="text-sm text-slate-muted mb-5 max-w-2xl">
        Degrees of separation between two players, traced through shared clubs.
      </p>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Field label="PLAYER A" value={playerA} onChange={setPlayerA} />
        <Field label="PLAYER B" value={playerB} onChange={setPlayerB} />
        <button
          onClick={run}
          className="self-end bg-live hover:bg-live-dim transition-colors text-pitch-night font-medium rounded-md py-3 text-data text-sm"
        >
          FIND PATH
        </button>
      </div>

      {status === 'loading' && <LoadingState label="Searching shortest path" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'done' && result?.chain && (
        <div className="dossier-card rounded-lg p-6">
          <p className="text-data text-xs text-floodlight mb-4">{result.hops} HOP{result.hops !== 1 ? 'S' : ''}</p>
          <div className="flex flex-wrap items-center gap-3">
            {result.chain.map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-chalk text-display text-lg">{name}</span>
                {i < result.chain.length - 1 && <span className="text-live">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ManagerLineagePanel() {
  const [club, setClub] = useState('Manchester City')
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const run = async () => {
    setStatus('loading')
    try {
      const data = await api.managerLineage(club)
      setResults(data.players || [])
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <p className="text-sm text-slate-muted mb-5 max-w-2xl">
        Players who played under a manager who later took charge at this club — surfaces
        tactical familiarity before a signing.
      </p>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Field label="CLUB" value={club} onChange={setClub} />
        <button
          onClick={run}
          className="self-end bg-live hover:bg-live-dim transition-colors text-pitch-night font-medium rounded-md py-3 text-data text-sm"
        >
          RUN QUERY
        </button>
      </div>

      {status === 'loading' && <LoadingState label="Tracing manager lineage" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'done' && results.length === 0 && (
        <EmptyState title="No lineage matches" hint="Try a club with a manager who's had multiple stops." />
      )}
      {status === 'done' && results.length > 0 && (
        <div className="grid gap-2">
          {results.map((r, i) => (
            <div key={i} className="dossier-card rounded-md px-5 py-4">
              <p className="text-chalk font-medium">{r.player_name}</p>
              <p className="text-sm text-slate-muted text-data">
                played under {r.manager_name} at {r.previous_club}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-data text-xs text-slate-muted tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="dossier-card rounded-md px-3 py-3 text-sm text-chalk outline-none focus:border-live transition-colors placeholder:text-slate-muted"
      />
    </div>
  )
}
