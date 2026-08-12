import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'

export default function ClubDetail() {
  const { name } = useParams()
  const [squad, setSquad] = useState([])
  const [clusters, setClusters] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus('loading')
    Promise.all([api.getSquad(name), api.getAgentClusters(name)])
      .then(([squadData, clusterData]) => {
        setSquad(squadData.squad || [])
        setClusters(clusterData.agent_clusters || [])
        setStatus('done')
      })
      .catch((e) => {
        setError(e.message)
        setStatus('error')
      })
  }, [name])

  if (status === 'loading') return <div className="max-w-6xl mx-auto px-6 py-12"><LoadingState label={`Pulling squad sheet for ${name}`} /></div>
  if (status === 'error') return <div className="max-w-6xl mx-auto px-6 py-12"><ErrorState message={error} /></div>

  const positionGroups = groupByPosition(squad)

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-12 pb-8 border-b border-pitch-line mb-8"
      >
        <p className="text-data text-xs text-live tracking-widest mb-2">CLUB DOSSIER</p>
        <h1 className="text-display text-6xl font-semibold text-chalk leading-none mb-2">
          {name}
        </h1>
        <p className="text-slate-muted text-data text-sm">
          {squad.length} player{squad.length !== 1 ? 's' : ''} on record
        </p>
      </motion.section>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-10">
          <section>
            <h2 className="text-display text-2xl text-chalk mb-4">Squad</h2>
            {squad.length === 0 ? (
              <EmptyState title="No squad data" hint="This club has no players on record in the graph." />
            ) : (
              <div className="space-y-6">
                {Object.entries(positionGroups).map(([position, players]) => (
                  <div key={position}>
                    <p className="text-data text-xs text-floodlight tracking-widest mb-2">
                      {position.toUpperCase()}S
                    </p>
                    <div className="grid gap-2">
                      {players.map((p) => (
                        <Link
                          key={p.name}
                          to={`/player/${encodeURIComponent(p.name)}`}
                          className="dossier-card rounded-md px-5 py-3.5 flex items-center justify-between hover:border-live transition-colors group"
                        >
                          <div>
                            <p className="text-chalk font-medium group-hover:text-floodlight transition-colors">
                              {p.name}
                            </p>
                            <p className="text-sm text-slate-muted text-data">
                              {p.nationality}
                            </p>
                          </div>
                          <p className="text-data text-sm text-live">
                            {p.appearances} apps · {p.goals} goals
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="dossier-card rounded-lg p-5">
            <p className="text-data text-xs text-floodlight tracking-widest mb-1">AGENT CLUSTERS</p>
            <p className="text-xs text-slate-muted mb-4 leading-relaxed">
              Agents who've moved 2+ players here — a signal relational tables bury in separate rows.
            </p>
            {clusters.length === 0 ? (
              <p className="text-sm text-slate-muted">No repeated-agent patterns detected.</p>
            ) : (
              <div className="space-y-4">
                {clusters.map((c, i) => (
                  <div key={i} className="border-t border-pitch-line pt-3 first:border-0 first:pt-0">
                    <p className="text-chalk text-sm font-medium">{c.agent_name}</p>
                    <p className="text-xs text-slate-muted mb-2">{c.agency}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.moves.map((m, j) => (
                        <span
                          key={j}
                          className="text-data text-[10px] bg-pitch-night border border-pitch-line rounded px-2 py-1 text-slate-muted"
                        >
                          {m.player} · {m.year}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
