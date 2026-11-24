import { useEffect, useState } from 'react'

export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const m = window.matchMedia(query)
    const onChange = (e) => setReduced(e.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function fmtCompact(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '-'
  const a = Math.abs(v)
  if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (a >= 1e8) return (v / 1e6).toFixed(0) + 'M'
  if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (a >= 1e3) return (v / 1e3).toFixed(0) + 'K'
  return String(Math.round(v))
}

export function CountUp({ value, decimals = 0, duration = 900, prefix = '', suffix = '' }) {
  const reduced = usePrefersReducedMotion()
  const target = Number(value)
  const valid = Number.isFinite(target)
  const [n, setN] = useState(reduced && valid ? target : 0)

  useEffect(() => {
    if (!valid) return undefined
    if (reduced) {
      setN(target)
      return undefined
    }
    let raf
    let start
    const tick = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / duration)
      setN(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, valid, duration, reduced])

  if (!valid) return <span>-</span>
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}

export function Tile({ children, className = '', accent = false, flare = false, ...rest }) {
  const bar = flare ? 'tile-flare' : accent ? 'tile-accent' : ''
  return (
    <div className={`tile ${bar} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function StatTile({ label, value, decimals = 0, prefix = '', suffix = '', index = 0 }) {
  return (
    <Tile accent className="reveal p-4 pl-5" style={{ '--i': index }}>
      <p className="text-data text-[11px] tracking-[0.18em] text-mute uppercase">{label}</p>
      <p className="text-display text-4xl sm:text-5xl text-chalk leading-none mt-2">
        <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </p>
    </Tile>
  )
}

export function Stripes({ className = '' }) {
  return <div aria-hidden="true" className={`stripes ${className}`} />
}

export function PageHeader({ kicker, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div className="reveal">
        {kicker && <p className="text-data text-xs tracking-[0.2em] text-volt uppercase mb-2">{kicker}</p>}
        <h1 className="text-display text-5xl sm:text-6xl text-chalk leading-[0.95]">{title}</h1>
        <Stripes className="h-1.5 w-28 mt-4 opacity-80" />
      </div>
      {children && <div className="reveal" style={{ '--i': 2 }}>{children}</div>}
    </div>
  )
}

export function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`slant px-4 py-1.5 border text-data text-xs tracking-wider transition-colors ${
              active
                ? 'bg-volt text-ink border-volt font-semibold'
                : 'border-edge text-mute hover:text-chalk hover:border-mute'
            }`}
          >
            <span className="unslant">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function DuelBar({ market, model, format = fmtCompact }) {
  const [go, setGo] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const m = Number(market)
  const p = Number(model)
  const max = Math.max(m || 0, p || 0, 1)
  const rows = [
    { key: 'MARKET', v: m, color: '#6E8091' },
    { key: 'MODEL', v: p, color: '#C8FF3C' },
  ]
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3">
          <span className="text-data text-[11px] tracking-[0.16em] text-mute w-14 shrink-0">{r.key}</span>
          <div className="flex-1 h-3.5 bg-ink border border-edge" style={{ transform: 'skewX(-12deg)' }}>
            <div
              className="h-full"
              style={{
                width: go && Number.isFinite(r.v) ? `${Math.max(2, (r.v / max) * 100)}%` : '0%',
                background: r.color,
                transition: 'width 0.9s cubic-bezier(0.2, 0.7, 0.2, 1)',
              }}
            />
          </div>
          <span className="text-data text-sm text-chalk w-16 text-right shrink-0">{format(r.v)}</span>
        </div>
      ))}
    </div>
  )
}

export function UpsideTile({ pct, label = 'MODEL UPSIDE', index = 0 }) {
  const v = Number(pct)
  const valid = Number.isFinite(v)
  const positive = valid && v >= 0
  return (
    <Tile accent={positive} flare={valid && !positive} className="reveal p-4 pl-5" style={{ '--i': index }}>
      <p className="text-data text-[11px] tracking-[0.18em] text-mute uppercase">{label}</p>
      <p
        className={`text-display text-5xl sm:text-6xl leading-none mt-2 ${
          positive ? 'text-volt' : 'text-flare'
        }`}
      >
        {valid ? <CountUp value={Math.abs(v)} decimals={0} prefix={positive ? '+' : '-'} suffix="%" /> : '-'}
      </p>
    </Tile>
  )
}