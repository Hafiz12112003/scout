import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'
import { Stripes, Tile } from '../components/ui'
import { euro } from '../lib/format'

function Shell({ children }) {
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">{children}</div>
}

export default function ClubDetail() {
  const { name } = useParams()
  const [squad, setSquad] = useState([])
  const [clusters, setClusters] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    Promise.all([api.getSquad(name), api.getAgentClusters(name)])
      .then(([squadData, clusterData]) => {
        if (!alive) return
        setSquad(squadData.squad || [])
        setClusters(clusterData.agent_clusters || [])
        setStatus('done')
      })
      .catch((e) => {
        if (!alive) return
        setError(e.message)
        setStatus('error')
      })
    return () => {
      alive = false
    }
  }, [name])

  if (status === 'loading')
    return (
      <Shell>
        <LoadingState label={`Pulling squad sheet for ${name}`} />
      </Shell>
    )
  if (status === 'error')
    return (
      <Shell>
        <ErrorState message={error} />
      </Shell>
    )

  const positionGroups = groupByPosition(squad)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
      <section className="pt-10 pb-8 mb-8 border-b border-edge">
        <p className="reveal text-data text-xs text-volt tracking-[0.22em] mb-3">CLUB DOSSIER</p>
        <h1 className="reveal text-display text-6xl sm:text-7xl md:text-8xl text-chalk leading-[0.88] break-words" style={{ '--i': 1 }}>
          {name}
        </h1>
        <Stripes className="reveal h-1.5 w-28 mt-4" />
        <p className="reveal text-data text-xs tracking-[0.16em] text-mute uppercase mt-4" style={{ '--i': 2 }}>
          {squad.length} player{squad.length !== 1 ? 's' : ''} on record
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-display text-3xl text-chalk mb-5">Squad</h2>
          {squad.length === 0 ? (
            <EmptyState title="No squad data" hint="This club has no players on record in the graph." />
          ) : (
            <div className="space-y-8">
              {Object.entries(positionGroups).map(([position, players]) => (
                <div key={position}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="slant bg-volt text-ink px-3 py-0.5 inline-block">
                      <span className="unslant text-data text-[11px] font-semibold tracking-[0.18em]">
                        {position.toUpperCase()}S
                      </span>
                    </span>
                    <span className="text-data text-[11px] text-mute">{players.length}</span>
                  </div>
                  <div className="grid gap-2">
                    {players.map((p, i) => (
                      <Link
                        key={p.name}
                        to={`/player/${encodeURIComponent(p.name)}`}
                        className="tile reveal px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-panel2 hover:border-volt transition-colors group"
                        style={{ '--i': Math.min(i, 8) }}
                      >
                        <div className="min-w-0">
                          <p className="text-display text-xl text-chalk group-hover:text-volt transition-colors truncate leading-tight">
                            {p.name}
                          </p>
                          <p className="text-data text-[11px] tracking-wider text-mute uppercase">{p.nationality}</p>
                        </div>
                        <p className="text-display text-2xl text-chalk shrink-0">
                          {p.market_value ? euro(p.market_value) : ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside>
          <Tile accent className="p-5 pl-6">
            <p className="text-data text-xs text-volt tracking-[0.2em] mb-1">AGENT CLUSTERS</p>
            <p className="text-xs text-mute mb-4 leading-relaxed">
              Agents who've moved 2+ players here - a signal relational tables bury in separate rows.
            </p>
            {clusters.length === 0 ? (
              <p className="text-sm text-mute">No repeated-agent patterns detected.</p>
            ) : (
              <div className="space-y-4">
                {clusters.map((c, i) => (
                  <div key={i} className="border-t border-edge pt-3 first:border-0 first:pt-0">
                    <p className="text-display text-xl text-chalk leading-tight">{c.agent_name}</p>
                    <p className="text-xs text-mute mb-2">{c.agency}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.moves.map((m, j) => (
                        <span
                          key={j}
                          className="slant border border-edge bg-ink px-2.5 py-1 text-data text-[10px] text-mute"
                        >
                          <span className="unslant">
                            {m.player} / {m.year}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tile>
        </aside>
      </div>
    </div>
  )
}

function groupByPosition(squad) {
  const order = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper']
  const groups = {}
  squad.forEach((p) => {
    const pos = p.position || 'Other'
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(p)
  })
  const sorted = {}
  order.forEach((pos) => {
    if (groups[pos]) sorted[pos] = groups[pos]
  })
  Object.keys(groups).forEach((pos) => {
    if (!sorted[pos]) sorted[pos] = groups[pos]
  })
  return sorted
}