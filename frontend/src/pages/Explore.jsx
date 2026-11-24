import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'
import { PageHeader, SegmentedControl, Tile } from '../components/ui'
import { euro } from '../lib/format'

const TABS = [
  { value: 'chain', label: 'SCOUTING CHAIN' },
  { value: 'path', label: 'SHORTEST PATH' },
  { value: 'lineage', label: 'MANAGER LINEAGE' },
]

export default function Explore() {
  const location = useLocation()
  const preset = location.state?.presetPlayer || ''
  const [tab, setTab] = useState('chain')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-10">
      <PageHeader kicker="GRAPH QUERIES" title="Run the traversals" />
      <p className="text-mute max-w-xl -mt-3 mb-8">
        These are the questions a relational database makes painful. Here, they're a graph pattern.
      </p>

      <div className="mb-8 pb-6 border-b border-edge">
        <SegmentedControl label="Query type" options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'chain' && <ScoutingChainPanel presetPlayer={preset} />}
      {tab === 'path' && <ShortestPathPanel />}
      {tab === 'lineage' && <ManagerLineagePanel />}
    </div>
  )
}

function ScoutingChainPanel({ presetPlayer }) {
  const [player, setPlayer] = useState(presetPlayer || 'Harry Kane')
  const [targetClub, setTargetClub] = useState('FC Barcelona')
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
    <div className="reveal">
      <p className="text-sm text-mute mb-5 max-w-2xl">
        Finds players under the age cutoff who shared a club with <span className="text-chalk">Player</span> and are
        not already at <span className="text-chalk">Target Club</span>, ranked by how undervalued the value model
        thinks they are (Premier League players only).
      </p>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Field label="PLAYER" value={player} onChange={setPlayer} placeholder="Jude Bellingham" />
        <Field label="TARGET CLUB" value={targetClub} onChange={setTargetClub} placeholder="Paris Saint-Germain" />
        <Field label="MAX AGE" value={maxAge} onChange={setMaxAge} type="number" />
        <RunButton onClick={run}>RUN QUERY</RunButton>
      </div>

      {status === 'loading' && <LoadingState label="Traversing the graph" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'done' && results.length === 0 && (
        <EmptyState title="No candidates found" hint="Try a different player or target club - the graph may not connect them." />
      )}
      {status === 'done' && results.length > 0 && (
        <div className="grid gap-2.5">
          {results.map((c, i) => (
            <Tile
              key={i}
              accent
              className="reveal px-5 pl-6 py-4 flex items-center justify-between gap-4"
              style={{ '--i': Math.min(i, 8) }}
            >
              <div className="min-w-0">
                <p className="text-display text-2xl text-chalk leading-tight truncate">{c.name}</p>
                <p className="text-data text-[11px] tracking-wider text-mute uppercase">
                  {c.position} / b.{c.birth_year} / via {c.shared_club}
                  {c.agent_name ? ` / agent: ${c.agent_name}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-display text-3xl text-chalk leading-none">{euro(c.market_value)}</p>
                {c.upside_pct != null && (
                  <p className={`text-data text-xs mt-1 ${c.upside_pct >= 0 ? 'text-volt' : 'text-flare'}`}>
                    {c.upside_pct > 0 ? '+' : ''}
                    {Math.round(c.upside_pct)}% vs model
                  </p>
                )}
              </div>
            </Tile>
          ))}
        </div>
      )}
    </div>
  )
}

function ShortestPathPanel() {
  const [playerA, setPlayerA] = useState('Harry Kane')
  const [playerB, setPlayerB] = useState('Lamine Yamal')
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
    <div className="reveal">
      <p className="text-sm text-mute mb-5 max-w-2xl">
        Degrees of separation between two players, traced through shared clubs.
      </p>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Field label="PLAYER A" value={playerA} onChange={setPlayerA} />
        <Field label="PLAYER B" value={playerB} onChange={setPlayerB} />
        <RunButton onClick={run}>FIND PATH</RunButton>
      </div>

      {status === 'loading' && <LoadingState label="Searching shortest path" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'done' && result?.chain && (
        <Tile accent className="reveal p-6 pl-7">
          <p className="text-display text-5xl text-volt leading-none mb-5">
            {result.hops} HOP{result.hops !== 1 ? 'S' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {result.chain.map((name, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="slant border border-edge bg-panel2 px-4 py-1.5 inline-block">
                  <span className="unslant text-display text-lg text-chalk">{name}</span>
                </span>
                {i < result.chain.length - 1 && (
                  <span className="text-volt text-data" aria-hidden="true">
                    &gt;&gt;
                  </span>
                )}
              </div>
            ))}
          </div>
        </Tile>
      )}
    </div>
  )
}

function ManagerLineagePanel() {
  const [club, setClub] = useState('FC Barcelona')
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
    <div className="reveal">
      <p className="text-sm text-mute mb-5 max-w-2xl">
        Players who played under a manager who later took charge at this club - surfaces tactical familiarity before a
        signing.
      </p>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Field label="CLUB" value={club} onChange={setClub} />
        <RunButton onClick={run}>RUN QUERY</RunButton>
      </div>

      {status === 'loading' && <LoadingState label="Tracing manager lineage" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'done' && results.length === 0 && (
        <EmptyState title="No lineage matches" hint="Try a club with a manager who's had multiple stops." />
      )}
      {status === 'done' && results.length > 0 && (
        <div className="grid gap-2.5">
          {results.map((r, i) => (
            <Tile key={i} accent className="reveal px-5 pl-6 py-4" style={{ '--i': Math.min(i, 8) }}>
              <p className="text-display text-2xl text-chalk leading-tight">{r.player_name}</p>
              <p className="text-data text-[11px] tracking-wider text-mute uppercase">
                played under {r.manager_name} at {r.previous_club}
              </p>
            </Tile>
          ))}
        </div>
      )}
    </div>
  )
}

function RunButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="self-end slant bg-volt hover:bg-volt-dim transition-colors text-ink py-3 px-6"
    >
      <span className="unslant text-data text-sm font-semibold tracking-wider">{children}</span>
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-data text-[10px] text-mute tracking-[0.2em]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="bg-panel border border-edge px-3 py-3 text-sm text-chalk outline-none focus:border-volt transition-colors placeholder:text-mute"
      />
    </div>
  )
}