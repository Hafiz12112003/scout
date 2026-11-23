import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'

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
  { label: '€5M+', value: 5000000 },
  { label: '€10M+', value: 10000000 },
  { label: '€20M+', value: 20000000 },
]

const millions = (v) => `€${(v / 1000000).toFixed(v >= 10000000 ? 0 : 1)}M`

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
    setStatus('loading')
    api
      .hiddenGems({ position, maxAge, minValue, limit: 20 })
      .then((data) => {
        setGems(data.gems || [])
        setStatus('done')
      })
      .catch((e) => {
        setError(e.message)
        setStatus('error')
      })
  }, [position, maxAge, minValue])

  const thisYear = new Date().getFullYear()

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24">
      <section className="pt-12 pb-8">
        <p className="text-data text-xs text-live tracking-widest mb-2">VALUE MODEL</p>
        <h1 className="text-display text-5xl font-semibold text-chalk mb-3">Hidden gems.</h1>
        <p className="text-slate-muted max-w-2xl">
          A neural network estimates what each Premier League player's market value should be from age, position and
          three seasons of output. These are the players priced furthest below that estimate.
        </p>
      </section>

      <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8 pb-6 border-b border-pitch-line">
        <Segment label="POSITION" options={POSITIONS} value={position} onChange={setPosition} />
        <Segment label="AGE" options={AGES} value={maxAge} onChange={setMaxAge} />
        <Segment label="MIN VALUE" options={VALUES} value={minValue} onChange={setMinValue} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {status === 'loading' && <LoadingState label="Ranking players" />}
          {status === 'error' && <ErrorState message={error} />}
          {status === 'done' && gems.length === 0 && (
            <EmptyState title="No players match" hint="Loosen the age or value filter." />
          )}
          {status === 'done' && gems.length > 0 && (
            <div className="grid gap-2">
              {gems.map((g, i) => {
                const top = Math.max(g.market_value, g.predicted_value)
                return (
                  <motion.div
                    key={g.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  >
                    <Link
                      to={`/player/${encodeURIComponent(g.name)}`}
                      className="dossier-card rounded-md px-5 py-4 flex items-center gap-5 hover:border-live transition-colors group"
                    >
                      <span className="text-data text-xs text-slate-muted w-6">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-display text-xl text-chalk group-hover:text-floodlight transition-colors truncate">
                          {g.name}
                        </p>
                        <p className="text-xs text-slate-muted text-data mb-3">
                          {g.club || '—'} · {g.position} · {thisYear - g.birth_year}
                        </p>
                        <Bar label="MARKET" value={g.market_value} top={top} tone="bg-slate-muted" />
                        <Bar label="MODEL" value={g.predicted_value} top={top} tone="bg-live" />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-display text-3xl text-floodlight leading-none">+{Math.round(g.upside_pct)}%</p>
                        <p className="text-data text-[10px] text-slate-muted mt-1">UPSIDE</p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <ModelCard card={card} />
        </aside>
      </div>
    </div>
  )
}

function Segment({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-data text-[10px] text-slate-muted tracking-widest mb-2">{label}</p>
      <div className="flex gap-1">
        {options.map((o) => (
          <button
            key={o.label}
            onClick={() => onChange(o.value)}
            className={`text-data text-xs px-3 py-2 rounded border transition-colors ${
              value === o.value
                ? 'border-floodlight text-floodlight bg-pitch-surface'
                : 'border-pitch-line text-slate-muted hover:text-chalk'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Bar({ label, value, top, tone }) {
  return (
    <div className="flex items-center gap-3 mb-1.5">
      <span className="text-data text-[10px] text-slate-muted w-12">{label}</span>
      <div className="flex-1 h-1.5 bg-pitch-night rounded-full overflow-hidden">
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${Math.max((value / top) * 100, 2)}%` }} />
      </div>
      <span className="text-data text-xs text-chalk w-14 text-right">{millions(value)}</span>
    </div>
  )
}

function ModelCard({ card }) {
  return (
    <div className="dossier-card rounded-lg p-5">
      <p className="text-data text-xs text-floodlight tracking-widest mb-1">HOW RELIABLE IS THIS?</p>
      <p className="text-xs text-slate-muted mb-4 leading-relaxed">
        Scores are cross-validated: each player is predicted by a model that never saw them.
      </p>
      {card?.blend_r2 ? (
        <div className="space-y-2 mb-4">
          <Metric label="RIDGE BASELINE" value={card.ridge_r2} />
          <Metric label="NEURAL NET ENSEMBLE" value={card.mlp_r2} />
          <Metric label="BLEND (USED)" value={card.blend_r2} strong />
          <p className="text-data text-[10px] text-slate-muted pt-1">
            R² ON LOG VALUE · {card.n_train} TRAINING PLAYERS
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-muted mb-4">Model details unavailable.</p>
      )}
      <ul className="text-xs text-slate-muted leading-relaxed space-y-2 border-t border-pitch-line pt-3">
        <li>The neural net alone does not beat the linear baseline at this data size; the blend is slightly better.</li>
        <li>
          The gap includes a club-size effect: players at newly promoted clubs tend to be priced lower for the same output.
        </li>
        <li>Premier League only, and only players with enough minutes. A starting point for scouting, not a verdict.</li>
      </ul>
      <p className="text-data text-[10px] text-slate-muted mt-4">
        DATA: github.com/oladeeayo/pl-catalogue
      </p>
    </div>
  )
}

function Metric({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-data text-xs ${strong ? 'text-chalk' : 'text-slate-muted'}`}>{label}</span>
      <span className={`text-data text-sm ${strong ? 'text-live' : 'text-chalk'}`}>{Number(value).toFixed(2)}</span>
    </div>
  )
}