import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, ErrorState } from '../components/States'
import { PageHeader, Tile, CountUp } from '../components/ui'
import PitchMap, { ChainSteps } from '../components/PitchMap'
import { euro } from '../lib/format'

const FALLBACK_EXAMPLES = [
  'Young left-backs priced under 20 million',
  'Undervalued midfielders under 23',
  'Players like Erling Haaland',
  'How could FC Barcelona reach Conor Bradley?',
  'Cheapest English forwards at Premier League clubs',
]

const INTENT_LABEL = {
  players: 'FILTER PLAYERS',
  similar: 'PLAYERS LIKE',
  reach: 'REACH PATH',
  unsupported: 'NOT SUPPORTED',
}
const SORT_LABEL = { upside: 'MODEL UPSIDE', youngest: 'YOUNGEST', oldest: 'OLDEST' }

const n = (v) => String(Number(v))
const eur = (v) => `\u20ac${n(v)}M`

function readAs(spec, intent) {
  const chips = [['INTENT', INTENT_LABEL[intent] || intent.toUpperCase()]]
  if (!spec) return chips
  const player = spec.player_resolved || spec.player
  const club = spec.club_resolved || spec.club
  if (intent !== 'players' && player) chips.push(['PLAYER', player])
  if (club) chips.push(['CLUB', club])
  if (intent === 'players') {
    if (spec.position) chips.push(['POSITION', spec.position.toUpperCase()])
    if (spec.role) chips.push(['ROLE', spec.role.toUpperCase()])
    if (spec.min_age != null && spec.max_age != null) chips.push(['AGE', `${n(spec.min_age)}-${n(spec.max_age)}`])
    else if (spec.max_age != null) chips.push(['AGE', `UP TO ${n(spec.max_age)}`])
    else if (spec.min_age != null) chips.push(['AGE', `${n(spec.min_age)}+`])
    if (spec.min_value_m != null && spec.max_value_m != null)
      chips.push(['VALUE', `${eur(spec.min_value_m)}-${n(spec.max_value_m)}M`])
    else if (spec.max_value_m != null) chips.push(['VALUE', `UP TO ${eur(spec.max_value_m)}`])
    else if (spec.min_value_m != null) chips.push(['VALUE', `${eur(spec.min_value_m)}+`])
    if (spec.league) chips.push(['LEAGUE', spec.league.toUpperCase()])
    if (spec.nationality) chips.push(['NATIONALITY', spec.nationality.toUpperCase()])
    if (spec.undervalued) chips.push(['FILTER', 'UNDERVALUED'])
    if (SORT_LABEL[spec.sort]) chips.push(['SORT', SORT_LABEL[spec.sort]])
  }
  return chips
}

export default function Ask() {
  const [question, setQuestion] = useState('')
  const [examples, setExamples] = useState(FALLBACK_EXAMPLES)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const reqId = useRef(0)

  useEffect(() => {
    api
      .assistantExamples()
      .then((d) => {
        if (Array.isArray(d.examples) && d.examples.length) setExamples(d.examples)
      })
      .catch(() => {})
  }, [])

  const ask = async (text) => {
    const q = text.trim()
    if (q.length < 3) return
    const id = ++reqId.current
    setStatus('loading')
    try {
      const d = await api.assistantQuery(q)
      if (id !== reqId.current) return
      setData(d)
      setStatus('done')
    } catch (e) {
      if (id !== reqId.current) return
      setError(e.message)
      setStatus('error')
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    ask(question)
  }

  const useExample = (ex) => {
    setQuestion(ex)
    ask(ex)
  }

  const intent = data?.intent
  const chips = status === 'done' && data ? readAs(data.interpretation, intent) : []
  const reachChain = intent === 'reach' ? data?.chain : null
  const spec = data?.interpretation

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-10">
      <PageHeader kicker="SCOUTING ASSISTANT" title="Ask the graph" />
      <p className="text-mute max-w-2xl -mt-3 mb-8">
        Ask in plain English. A language model only turns your question into a structured filter; the filter is
        checked in code and run against the graph as a fixed, parameterised query.
      </p>

      <form onSubmit={onSubmit} className="mb-4 reveal">
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <div className="tile tile-accent flex items-center gap-3 pl-5 pr-2 focus-within:border-volt transition-colors">
          <span className="text-volt text-data text-sm select-none" aria-hidden="true">
            &gt;
          </span>
          <input
            id="ask-input"
            autoFocus
            maxLength={200}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. young left-backs priced under 20 million"
            className="flex-1 bg-transparent outline-none py-4 text-chalk placeholder:text-mute text-data text-sm"
          />
          <button
            type="submit"
            disabled={status === 'loading' || question.trim().length < 3}
            className="slant bg-volt hover:bg-volt-dim disabled:opacity-40 transition-colors text-ink py-2.5 px-5 my-1.5 mr-1"
          >
            <span className="unslant text-data text-xs font-semibold tracking-wider">ASK</span>
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-1.5 mb-10">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => useExample(ex)}
            className="slant border border-edge px-3.5 py-1.5 text-data text-[11px] text-mute hover:text-chalk hover:border-volt transition-colors"
          >
            <span className="unslant">{ex}</span>
          </button>
        ))}
      </div>

      {status === 'loading' && <LoadingState label="Reading your question" />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'done' && data && (
        <div>
          <div className="mb-8">
            <p className="text-data text-[10px] tracking-[0.2em] text-mute mb-2">READ AS</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map(([k, v], i) => (
                <span
                  key={`${k}-${i}`}
                  className="slant reveal bg-panel2 border border-edge px-3 py-1 inline-block"
                  style={{ '--i': Math.min(i, 8) }}
                >
                  <span className="unslant text-data text-[11px] tracking-wider">
                    <span className="text-mute">{k}</span> <span className="text-volt font-semibold">{v}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>

          {data.message && (
            <Tile flare={!data.results?.length && !reachChain} accent={!!reachChain} className="p-5 pl-6 mb-6">
              <p className="text-sm text-chalk">{data.message}</p>
            </Tile>
          )}

          {intent === 'players' && data.results?.length > 0 && (
            <div className="grid gap-2.5">
              {data.results.map((r, i) => (
                <PlayerRow key={r.name} r={r} i={i} />
              ))}
            </div>
          )}

          {intent === 'similar' && data.results?.length > 0 && (
            <div className="grid gap-2.5">
              {data.results.map((r, i) => (
                <PlayerRow key={r.name} r={r} i={i} score={r.score} />
              ))}
            </div>
          )}

          {intent === 'reach' && reachChain && (
            <div className="space-y-6">
              <Tile accent className="reveal p-5 pl-7 flex flex-wrap items-center justify-between gap-4">
                <p className="text-display text-5xl text-volt leading-none">
                  {reachChain.hops} HOP{reachChain.hops !== 1 ? 'S' : ''}
                </p>
                <Link
                  to={`/reach?club=${encodeURIComponent(spec?.club_resolved || '')}&player=${encodeURIComponent(spec?.player_resolved || '')}`}
                  className="slant border border-edge px-4 py-1.5 text-data text-xs text-mute hover:text-chalk hover:border-volt transition-colors"
                >
                  <span className="unslant">OPEN IN REACH</span>
                </Link>
              </Tile>
              <div className="tile p-4">
                <PitchMap chain={reachChain.chain} />
              </div>
              <ChainSteps chain={reachChain.chain} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlayerRow({ r, i, score }) {
  const year = new Date().getFullYear()
  const up = Number(r.upside_pct)
  const hasUp = r.upside_pct != null && Number.isFinite(up)
  const meta = [r.club, r.role || r.position, r.nationality, r.birth_year ? year - r.birth_year : null]
    .filter((x) => x !== null && x !== undefined && x !== '')
    .join(' / ')
  return (
    <Link
      to={`/player/${encodeURIComponent(r.name)}`}
      className="tile tile-accent reveal group flex items-center justify-between gap-4 px-5 pl-6 py-4 hover:bg-panel2 transition-colors"
      style={{ '--i': Math.min(i, 8) }}
    >
      <div className="min-w-0">
        <p className="text-display text-2xl text-chalk group-hover:text-volt transition-colors truncate leading-tight">
          {r.name}
        </p>
        <p className="text-data text-[11px] tracking-wider text-mute uppercase truncate">{meta}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-display text-3xl text-chalk leading-none">{euro(r.market_value)}</p>
        {score != null ? (
          <p className="text-data text-xs mt-1 text-volt">{Math.round(score * 100)}% match</p>
        ) : (
          hasUp && (
            <p className={`text-data text-xs mt-1 ${up >= 0 ? 'text-volt' : 'text-flare'}`}>
              <CountUp value={Math.abs(up)} prefix={up >= 0 ? '+' : '-'} suffix="% vs model" />
            </p>
          )
        )}
      </div>
    </Link>
  )
}