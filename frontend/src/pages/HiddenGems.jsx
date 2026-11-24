import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'
import { PageHeader, SegmentedControl, DuelBar, Tile, CountUp } from '../components/ui'
import { euro } from '../lib/format'

const POSITIONS = [
  { label: 'ALL', value: '' },
  { label: 'FWD', value: 'Forward' },
  { label: 'MID', value: 'Midfielder' },
  { label: 'DEF', value: 'Defender' },
  { label: 'GK', value: 'Goalkeeper' },
]
const AGES = [
  { label: 'U23', value: 23 },
  { label: 'U25', value: 25 },
  { label: 'U28', value: 28 },
  { label: 'ANY', value: 45 },
]
const VALUES = [
  { label: '\u20ac5M+', value: 5000000 },
  { label: '\u20ac10M+', value: 10000000 },
  { label: '\u20ac20M+', value: 20000000 },
]

export default function HiddenGems() {
  const [position, setPosition] = useState('')
  const [maxAge, setMaxAge] = useState(25)
  const [minValue, setMinValue] = useState(5000000)
  const [gems, setGems] = useState([])
  const [card, setCard] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    api.modelCard().then(setCard).catch(() => setCard(null))
  }, [])

  useEffect(() => {
    let alive = true
    setStatus('loading')
    api
      .hiddenGems({ position, maxAge, minValue, limit: 20 })
      .then((data) => {
        if (!alive) return
        setGems(data.gems || [])
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
  }, [position, maxAge, minValue])

  const thisYear = new Date().getFullYear()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-10">
      <PageHeader kicker="VALUE MODEL" title="Hidden gems" />
      <p className="text-mute max-w-2xl -mt-3 mb-8">
        A neural network estimates what each Premier League player's market value should be from age, position and
        three seasons of output. These are the players priced furthest below that estimate.
      </p>

      <div className="flex flex-wrap gap-x-10 gap-y-5 mb-8 pb-6 border-b border-edge">
        <Filter label="POSITION">
          <SegmentedControl label="Position" options={POSITIONS} value={position} onChange={setPosition} />
        </Filter>
        <Filter label="AGE">
          <SegmentedControl label="Maximum age" options={AGES} value={maxAge} onChange={setMaxAge} />
        </Filter>
        <Filter label="MIN VALUE">
          <SegmentedControl label="Minimum market value" options={VALUES} value={minValue} onChange={setMinValue} />
        </Filter>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {status === 'loading' && <LoadingState label="Ranking players" />}
          {status === 'error' && <ErrorState message={error} />}
          {status === 'done' && gems.length === 0 && (
            <EmptyState title="No players match" hint="Loosen the age or value filter." />
          )}
          {status === 'done' && gems.length > 0 && (
            <div className="grid gap-3">
              {gems.map((g, i) => {
                const up = Number(g.upside_pct)
                const positive = up >= 0
                return (
                  <Link
                    key={g.name}
                    to={`/player/${encodeURIComponent(g.name)}`}
                    className={`tile ${positive ? 'tile-accent' : 'tile-flare'} reveal group block p-4 pl-6 hover:bg-panel2 transition-colors`}
                    style={{ '--i': Math.min(i, 8) }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="text-display text-3xl text-edge group-hover:text-mute transition-colors w-9 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-display text-2xl text-chalk group-hover:text-volt transition-colors truncate leading-tight">
                          {g.name}
                        </p>
                        <p className="text-data text-[11px] tracking-wider text-mute uppercase mb-3">
                          {g.club || '-'} / {g.position} / {thisYear - g.birth_year}
                        </p>
                        <DuelBar market={g.market_value} model={g.predicted_value} format={euro} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-display text-4xl sm:text-5xl leading-none ${positive ? 'text-volt' : 'text-flare'}`}>
                          <CountUp value={Math.abs(up)} prefix={positive ? '+' : '-'} suffix="%" />
                        </p>
                        <p className="text-data text-[10px] tracking-[0.18em] text-mute mt-1">UPSIDE</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <aside>
          <ModelCard card={card} />
        </aside>
      </div>
    </div>
  )
}

function Filter({ label, children }) {
  return (
    <div>
      <p className="text-data text-[10px] text-mute tracking-[0.2em] mb-2">{label}</p>
      {children}
    </div>
  )
}

function ModelCard({ card }) {
  return (
    <Tile accent className="p-5 pl-6">
      <p className="text-data text-xs text-volt tracking-[0.2em] mb-1">HOW RELIABLE IS THIS?</p>
      <p className="text-xs text-mute mb-4 leading-relaxed">
        Scores are cross-validated: each player is predicted by a model that never saw them.
      </p>
      {card?.blend_r2 ? (
        <div className="space-y-2 mb-4">
          <Metric label="RIDGE BASELINE" value={card.ridge_r2} />
          <Metric label="NEURAL NET ENSEMBLE" value={card.mlp_r2} />
          <Metric label="BLEND (USED)" value={card.blend_r2} strong />
          <p className="text-data text-[10px] text-mute pt-1">
            R2 ON LOG VALUE / {card.n_train} TRAINING PLAYERS
          </p>
        </div>
      ) : (
        <p className="text-sm text-mute mb-4">Model details unavailable.</p>
      )}
      <ul className="text-xs text-mute leading-relaxed space-y-2 border-t border-edge pt-3">
        <li>The neural net alone does not beat the linear baseline at this data size; the blend is slightly better.</li>
        <li>
          The gap includes a club-size effect: players at newly promoted clubs tend to be priced lower for the same output.
        </li>
        <li>Premier League only, and only players with enough minutes. A starting point for scouting, not a verdict.</li>
      </ul>
      <p className="text-data text-[10px] text-mute mt-4">
        DATA:{' '}
        <a
          className="text-chalk underline decoration-edge hover:decoration-volt"
          href="https://github.com/oladeeayo/pl-catalogue"
          target="_blank"
          rel="noreferrer"
        >
          github.com/oladeeayo/pl-catalogue
        </a>
      </p>
    </Tile>
  )
}

function Metric({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-data text-xs ${strong ? 'text-chalk' : 'text-mute'}`}>{label}</span>
      <span className={`text-data text-sm ${strong ? 'text-volt font-semibold' : 'text-chalk'}`}>
        {Number(value).toFixed(2)}
      </span>
    </div>
  )
}