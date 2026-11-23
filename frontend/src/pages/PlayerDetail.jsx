import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api'
import { LoadingState, ErrorState } from '../components/States'
import NetworkGraph from '../components/NetworkGraph'

const millions = (v) => `€${(v / 1000000).toFixed(v >= 10000000 ? 0 : 1)}M`

export default function PlayerDetail() {
  const { name } = useParams()
  const [player, setPlayer] = useState(null)
  const [teammates, setTeammates] = useState([])
  const [similar, setSimilar] = useState([])
  const [similarMethod, setSimilarMethod] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus('loading')
    Promise.all([api.getPlayer(name), api.getTeammates(name), api.getSimilarPlayers(name)])
      .then(([playerData, teammateData, similarData]) => {
        setPlayer(playerData)
        setTeammates(teammateData.teammates || [])
        setSimilar(similarData.similar || [])
        setSimilarMethod(similarData.method || '')
        setStatus('done')
      })
      .catch((e) => {
        setError(e.message)
        setStatus('error')
      })
  }, [name])

  if (status === 'loading') return <div className="max-w-6xl mx-auto px-6 py-12"><LoadingState label={`Pulling dossier on ${name}`} /></div>
  if (status === 'error') return <div className="max-w-6xl mx-auto px-6 py-12"><ErrorState message={error} /></div>
  if (!player || !player.name) return <div className="max-w-6xl mx-auto px-6 py-12"><ErrorState message="Player not found in the graph" /></div>

  const clubsHistory = (player.clubs_history || []).filter((c) => c.club).sort((a, b) => (a.from_year || 0) - (b.from_year || 0))
  const hasModel = player.predicted_value != null && player.market_value
  const approx = player.value_source === 'approximate'

  const graphNodes = [
    { id: 'center', label: player.name },
    ...teammates.slice(0, 8).map((t) => ({ id: t.name, label: t.name })),
  ]
  const graphEdges = teammates.slice(0, 8).map((t) => ({
    source: 'center',
    target: t.name,
    label: t.shared_club,
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-12 pb-8 border-b border-pitch-line mb-8"
      >
        <p className="text-data text-xs text-live tracking-widest mb-2">PLAYER DOSSIER</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-display text-6xl font-semibold text-chalk leading-none mb-2">
              {player.name}
            </h1>
            <p className="text-slate-muted text-data text-sm">
              {player.position} · {player.nationality} · b.{player.birth_year}
            </p>
          </div>
          <div className="text-right">
            <p className="text-data text-xs text-slate-muted mb-1">MARKET VALUE{approx ? ' (APPROX.)' : ''}</p>
            <p className="text-display text-4xl text-floodlight">
              {player.market_value ? millions(player.market_value) : '—'}
            </p>
          </div>
        </div>
      </motion.section>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-10">
          <section>
            <h2 className="text-display text-2xl text-chalk mb-4">Career Timeline</h2>
            <div className="space-y-0">
              {clubsHistory.map((stint, i) => (
                <div key={i} className="flex gap-4 py-4 border-b border-pitch-line last:border-0">
                  <div className="text-data text-sm text-live w-28 shrink-0">
                    {stint.from_year || '—'}–{stint.to_year || 'now'}
                  </div>
                  <div className="flex-1">
                    <Link
                      to={`/club/${encodeURIComponent(stint.club)}`}
                      className="text-chalk font-medium hover:text-floodlight transition-colors"
                    >
                      {stint.club}
                    </Link>
                    {stint.appearances != null && (
                      <p className="text-sm text-slate-muted text-data">
                        {stint.appearances} apps · {stint.goals ?? 0} goals
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {teammates.length > 0 && (
            <section>
              <h2 className="text-display text-2xl text-chalk mb-1">Network</h2>
              <p className="text-sm text-slate-muted mb-4">
                Former teammates, positioned by connection strength.
              </p>
              <div className="dossier-card rounded-lg p-4">
                <NetworkGraph nodes={graphNodes} edges={graphEdges} centerNodeId="center" height={360} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="dossier-card rounded-lg p-5">
            <p className="text-data text-xs text-floodlight tracking-wide mb-3">VALUE MODEL</p>
            {hasModel ? (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-data text-[10px] text-slate-muted">MODEL ESTIMATE</p>
                    <p className="text-display text-3xl text-chalk leading-none">{millions(player.predicted_value)}</p>
                  </div>
                  <p
                    className={`text-display text-2xl leading-none ${
                      player.upside_pct >= 0 ? 'text-live' : 'text-floodlight'
                    }`}
                  >
                    {player.upside_pct >= 0 ? '+' : ''}
                    {Math.round(player.upside_pct)}%
                  </p>
                </div>
                <p className="text-xs text-slate-muted leading-relaxed">
                  {player.upside_pct >= 0 ? 'Priced below' : 'Priced above'} what age, position and three seasons of
                  output suggest. Based on about {Math.round(player.model_minutes)} weighted minutes. Includes a
                  club-size effect.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-muted leading-relaxed">
                No estimate: the model covers Premier League players with enough minutes.
              </p>
            )}
          </div>

          <div className="dossier-card rounded-lg p-5">
            <p className="text-data text-xs text-slate-muted tracking-wide mb-3">REPRESENTATION</p>
            <p className="text-chalk font-medium">{player.agent_name || 'Unlisted'}</p>
            {player.agent_agency && <p className="text-sm text-slate-muted">{player.agent_agency}</p>}
            {player.agent_source === 'reported' && (
              <p className="text-data text-[10px] text-slate-muted mt-2">PUBLICLY REPORTED · NOT VERIFIED</p>
            )}
          </div>

          {similar.length > 0 && (
            <div className="dossier-card rounded-lg p-5">
              <p className="text-data text-xs text-floodlight tracking-wide mb-1">
                {similarMethod === 'neural' ? 'PLAYERS LIKE THIS' : 'SCOUTING ALTERNATIVES'}
              </p>
              <p className="text-xs text-slate-muted mb-3">
                {similarMethod === 'neural'
                  ? 'Nearest in the neural network’s learned player space'
                  : 'Same position, comparable value'}
              </p>
              <div className="space-y-3">
                {similar.map((s) => (
                  <Link
                    key={s.name}
                    to={`/player/${encodeURIComponent(s.name)}`}
                    className="flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm text-chalk group-hover:text-floodlight transition-colors">{s.name}</p>
                      <p className="text-xs text-slate-muted">{s.nationality}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-data text-xs text-live">{s.market_value ? millions(s.market_value) : ''}</p>
                      {s.score != null && (
                        <p className="text-data text-[10px] text-slate-muted">{Math.round(s.score * 100)}% MATCH</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link
            to="/explore"
            state={{ presetPlayer: player.name }}
            className="block dossier-card rounded-lg p-5 hover:border-live transition-colors"
          >
            <p className="text-data text-xs text-floodlight tracking-wide mb-2">RUN A QUERY</p>
            <p className="text-sm text-chalk leading-relaxed">
              Find scouting candidates connected to {player.name}
            </p>
          </Link>
        </aside>
      </div>
    </div>
  )
}