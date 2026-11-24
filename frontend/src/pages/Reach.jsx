import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { LoadingState, EmptyState, ErrorState } from '../components/States'
import { PageHeader, Tile } from '../components/ui'
import PitchMap, { ChainSteps } from '../components/PitchMap'
import { euro } from '../lib/format'

async function fetchClubs(q) {
  const d = await api.searchClubs(q)
  const list = Array.isArray(d) ? d : d.clubs || d.results || []
  return list
    .map((c) => (typeof c === 'string' ? { name: c } : { name: c.name, meta: c.league || c.country || '' }))
    .filter((c) => c.name)
}

async function fetchPlayers(q) {
  const d = await api.searchPlayers(q)
  return (d.players || []).map((p) => ({
    name: p.name,
    meta: [p.position, p.market_value ? euro(p.market_value) : ''].filter(Boolean).join(' / '),
  }))
}

export default function Reach() {
  const [params, setParams] = useSearchParams()
  const [club, setClub] = useState(params.get('club') || '')
  const [player, setPlayer] = useState(params.get('player') || '')
  const [status, setStatus] = useState('idle') // idle | loading | done | empty | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const reqId = useRef(0)

  const run = async (c, p) => {
    if (!c.trim() || !p.trim()) return
    const id = ++reqId.current
    setStatus('loading')
    try {
      const d = await api.reach(c.trim(), p.trim())
      if (id !== reqId.current) return
      setResult(d)
      setStatus('done')
    } catch (e) {
      if (id !== reqId.current) return
      if (/no connection/i.test(e.message)) {
        setStatus('empty')
      } else {
        setError(e.message)
        setStatus('error')
      }
    }
  }

  useEffect(() => {
    const c = params.get('club')
    const p = params.get('player')
    if (c && p) run(c, p)
    // run once on load for deep links
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e) => {
    e.preventDefault()
    setParams({ club: club.trim(), player: player.trim() }, { replace: true })
    run(club, player)
  }

  const fill = () => {
    setClub('FC Barcelona')
    setPlayer('Conor Bradley')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-10">
      <PageHeader kicker="REACH PATH" title="How could a club reach a player?" />
      <p className="text-mute max-w-2xl -mt-3 mb-8">
        Traces the shortest chain of squads and managers between a club and a player. Each link is a person or a club
        the two sides already share, which is the warm route a scout would try first.
      </p>

      <form onSubmit={submit} className="grid md:grid-cols-5 gap-3 mb-3">
        <div className="md:col-span-2">
          <Typeahead id="reach-club" label="CLUB" value={club} onChange={setClub} fetcher={fetchClubs} placeholder="FC Barcelona" />
        </div>
        <div className="md:col-span-2">
          <Typeahead id="reach-player" label="PLAYER" value={player} onChange={setPlayer} fetcher={fetchPlayers} placeholder="Conor Bradley" />
        </div>
        <button
          type="submit"
          disabled={!club.trim() || !player.trim() || status === 'loading'}
          className="self-end slant bg-volt hover:bg-volt-dim disabled:opacity-40 transition-colors text-ink py-3 px-6"
        >
          <span className="unslant text-data text-sm font-semibold tracking-wider">TRACE PATH</span>
        </button>
      </form>

      <div className="mb-10">
        <button
          type="button"
          onClick={fill}
          className="slant border border-edge px-3.5 py-1.5 text-data text-[11px] text-mute hover:text-chalk hover:border-volt transition-colors"
        >
          <span className="unslant">TRY: FC BARCELONA TO CONOR BRADLEY</span>
        </button>
      </div>

      {status === 'loading' && <LoadingState label="Tracing the shortest chain" />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'empty' && (
        <EmptyState
          title="No connection found"
          hint="No chain of squads and managers links them within six steps. Check the spelling, or try another pairing."
        />
      )}
      {status === 'done' && result?.chain && (
        <div className="space-y-6">
          <Tile accent className="reveal p-5 pl-7">
            <p className="text-display text-5xl text-volt leading-none">
              {result.hops} HOP{result.hops !== 1 ? 'S' : ''}
            </p>
          </Tile>
          <div className="tile p-4">
            <PitchMap chain={result.chain} />
          </div>
          <div>
            <h2 className="text-display text-2xl text-chalk mb-3">In plain English</h2>
            <ChainSteps chain={result.chain} />
          </div>
        </div>
      )}
    </div>
  )
}

function Typeahead({ id, label, value, onChange, fetcher, placeholder }) {
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const boxRef = useRef(null)
  const focused = useRef(false)
  const skip = useRef(false)

  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return undefined
    }
    if (value.trim().length < 2) {
      setOptions([])
      return undefined
    }
    let alive = true
    const t = setTimeout(() => {
      fetcher(value.trim())
        .then((list) => {
          if (!alive) return
          setOptions(list.slice(0, 6))
          setActive(-1)
          if (focused.current) setOpen(true)
        })
        .catch(() => {
          if (alive) setOptions([])
        })
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [value, fetcher])

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pick = (opt) => {
    skip.current = true
    onChange(opt.name)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % options.length)
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault()
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1))
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault()
      pick(options[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && options.length > 0

  return (
    <div className="relative flex flex-col gap-1.5" ref={boxRef}>
      <label htmlFor={id} className="text-data text-[10px] text-mute tracking-[0.2em]">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          focused.current = true
          if (options.length) setOpen(true)
        }}
        onBlur={() => {
          focused.current = false
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="bg-panel border border-edge px-3 py-3 text-sm text-chalk outline-none focus:border-volt transition-colors placeholder:text-mute"
      />
      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-10 bg-panel border border-edge"
        >
          {options.map((o, i) => (
            <li
              key={`${o.name}-${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(o)
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 cursor-pointer flex items-baseline justify-between gap-3 ${
                i === active ? 'bg-panel2 text-volt' : 'text-chalk'
              }`}
            >
              <span className="text-sm truncate">{o.name}</span>
              {o.meta && <span className="text-data text-[10px] text-mute uppercase shrink-0">{o.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}