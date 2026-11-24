import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, ErrorState } from '../components/States'
import NetworkGraph from '../components/NetworkGraph'
import { DuelBar, Stripes, Tile, UpsideTile } from '../components/ui'
import { euro } from '../lib/format'

function Shell({ children }) {
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">{children}</div>
}

export default function PlayerDetail() {
  const { name } = useParams()
  const [player, setPlayer] = useState(null)
  const [teammates, setTeammates] = useState([])
  const [similar, setSimilar] = useState([])
  const [similarMethod, setSimilarMethod] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    Promise.all([api.getPlayer(name), api.getTeammates(name), api.getSimilarPlayers(name)])
      .then(([playerData, teammateData, similarData]) => {
        if (!alive) return
        setPlayer(playerData)
        setTeammates(teammateData.teammates || [])
        setSimilar(similarData.similar || [])
        setSimilarMethod(similarData.method || '')
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
        <LoadingState label={`Pulling dossier on ${name}`} />
      </Shell>
    )
  if (status === 'error')
    return (
      <Shell>
        <ErrorState message={error} />
      </Shell>
    )
  if (!player || !player.name)
    return (
      <Shell>
        <ErrorState message="Player not found in the graph" />
      </Shell>
    )

  const clubsHistory = (player.clubs_history || [])
    .filter((c) => c.club)
    .sort((a, b) => (a.from_year || 0) - (b.from_year || 0))
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
      <section className="pt-10 pb-8 mb-8 border-b border-edge">
        <p className="reveal text-data text-xs text-volt tracking-[0.22em] mb-3">PLAYER DOSSIER</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="reveal min-w-0" style={{ '--i': 1 }}>
            <h1 className="text-display text-6xl sm:text-7xl md:text-8xl text-chalk leading-[0.88] break-words">
              {player.name}
            </h1>
            <Stripes className="h-1.5 w-28 mt-4" />
            <p className="text-data text-xs tracking-[0.16em] text-mute uppercase mt-4">
              {player.position} / {player.nationality} / b.{player.birth_year}
            </p>
          </div>
          <Tile accent className="reveal p-4 pl-6 min-w-[200px]" style={{ '--i': 2 }}>
            <p className="text-data text-[11px] tracking-[0.18em] text-mute">
              MARKET VALUE{approx ? ' (APPROX.)' : ''}
            </p>
            <p className="text-display text-5xl text-chalk leading-none mt-2">
              {player.market_value ? euro(player.market_value) : '-'}
            </p>
          </Tile>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-12">
          <section>
            <h2 className="text-display text-3xl text-chalk mb-5">Career timeline</h2>
            <div className="ml-1.5">
              {clubsHistory.map((stint, i) => (
                <div
                  key={i}
                  className="reveal relative pl-6 py-3.5 border-l border-edge"
                  style={{ '--i': Math.min(i, 8) }}
                >
                  <span
                    className="absolute -left-[5px] top-[22px] w-2.5 h-2.5 bg-volt"
                    style={{ transform: 'skewX(-12deg)' }}
                  />
                  <div className="flex gap-4 items-baseline">
                    <div className="text-data text-sm text-volt w-28 shrink-0">
                      {stint.from_year || '-'}-{stint.to_year || 'now'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/club/${encodeURIComponent(stint.club)}`}
                        className="text-display text-2xl text-chalk hover:text-volt transition-colors leading-tight"
                      >
                        {stint.club}
                      </Link>
                      {stint.appearances != null && (
                        <p className="text-data text-[11px] tracking-wider text-mute uppercase">
                          {stint.appearances} apps / {stint.goals ?? 0} goals
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {teammates.length > 0 && (
            <section>
              <h2 className="text-display text-3xl text-chalk mb-1">Network</h2>
              <p className="text-sm text-mute mb-4">Former teammates, positioned by connection strength.</p>
              <div className="tile p-4">
                <NetworkGraph nodes={graphNodes} edges={graphEdges} centerNodeId="center" height={360} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          {hasModel ? (
            <>
              <UpsideTile pct={player.upside_pct} />
              <Tile className="reveal p-5 pl-6" style={{ '--i': 1 }}>
                <p className="text-data text-xs text-volt tracking-[0.2em] mb-4">MARKET VS MODEL</p>
                <DuelBar market={player.market_value} model={player.predicted_value} format={euro} />
                <p className="text-xs text-mute leading-relaxed mt-4">
                  {player.upside_pct >= 0 ? 'Priced below' : 'Priced above'} what age, position and three seasons of
                  output suggest. Based on about {Math.round(player.model_minutes)} weighted minutes. Includes a
                  club-size effect.
                </p>
              </Tile>
            </>
          ) : (
            <Tile className="reveal p-5 pl-6">
              <p className="text-data text-xs text-volt tracking-[0.2em] mb-2">VALUE MODEL</p>
              <p className="text-sm text-mute leading-relaxed">
                No estimate: the model covers Premier League players with enough minutes.
              </p>
            </Tile>
          )}

          <Tile className="reveal p-5 pl-6" style={{ '--i': 2 }}>
            <p className="text-data text-xs text-mute tracking-[0.2em] mb-3">REPRESENTATION</p>
            <p className="text-display text-2xl text-chalk leading-tight">{player.agent_name || 'Unlisted'}</p>
            {player.agent_agency && <p className="text-sm text-mute mt-1">{player.agent_agency}</p>}
            {player.agent_source === 'reported' && (
              <p className="text-data text-[10px] tracking-wider text-mute mt-3">PUBLICLY REPORTED / NOT VERIFIED</p>
            )}
          </Tile>

          {similar.length > 0 && (
            <Tile className="reveal p-5 pl-6" style={{ '--i': 3 }}>
              <p className="text-data text-xs text-volt tracking-[0.2em] mb-1">
                {similarMethod === 'neural' ? 'PLAYERS LIKE THIS' : 'SCOUTING ALTERNATIVES'}
              </p>
              <p className="text-xs text-mute mb-4">
                {similarMethod === 'neural'
                  ? "Nearest in the neural network's learned player space"
                  : 'Same position, comparable value'}
              </p>
              <div className="space-y-3.5">
                {similar.map((s) => (
                  <Link
                    key={s.name}
                    to={`/player/${encodeURIComponent(s.name)}`}
                    className="block group"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-display text-xl text-chalk group-hover:text-volt transition-colors leading-tight truncate">
                        {s.name}
                      </p>
                      <p className="text-data text-xs text-chalk shrink-0">
                        {s.market_value ? euro(s.market_value) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-data text-[10px] tracking-wider text-mute uppercase truncate">
                        {s.nationality}
                      </span>
                      {s.score != null && (
                        <>
                          <div className="flex-1 h-1 bg-ink border border-edge" style={{ transform: 'skewX(-12deg)' }}>
                            <div
                              className="h-full bg-volt"
                              style={{ width: `${Math.max(2, Math.min(100, Math.round(s.score * 100)))}%` }}
                            />
                          </div>
                          <span className="text-data text-[10px] text-volt shrink-0">
                            {Math.round(s.score * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Tile>
          )}

          <Link
            to="/explore"
            state={{ presetPlayer: player.name }}
            className="tile reveal block p-5 hover:bg-panel2 hover:border-volt transition-colors"
            style={{ '--i': 4 }}
          >
            <Stripes className="h-1 w-12 mb-3" />
            <p className="text-display text-2xl text-chalk mb-1">Run a query</p>
            <p className="text-sm text-mute leading-relaxed">Find scouting candidates connected to {player.name}</p>
          </Link>
        </aside>
      </div>
    </div>
  )
}