import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Ticker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let alive = true
    api
      .hiddenGems({ maxAge: 28, minValue: 5000000, limit: 12 })
      .then((d) => {
        if (alive) setItems((d.gems || []).filter((g) => Number.isFinite(Number(g.upside_pct))))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (items.length === 0) return null

  const row = (hidden) =>
    items.map((g) => (
      <Link
        key={`${hidden ? 'b' : 'a'}-${g.name}`}
        to={`/player/${encodeURIComponent(g.name)}`}
        tabIndex={hidden ? -1 : undefined}
        aria-hidden={hidden ? true : undefined}
        className="flex items-center gap-2 px-5 shrink-0 hover:text-volt transition-colors"
      >
        <span className="w-1.5 h-1.5 bg-volt" style={{ transform: 'skewX(-12deg)' }} />
        <span className="text-data text-[12px] tracking-wider text-chalk uppercase">{g.name}</span>
        <span className="text-data text-[12px] font-semibold text-volt">+{Math.round(g.upside_pct)}%</span>
      </Link>
    ))

  return (
    <div className="border-t border-edge bg-panel/80 flex items-stretch overflow-hidden" role="region" aria-label="Hidden gems ticker">
      <div className="slant bg-volt text-ink pl-6 pr-4 flex items-center shrink-0 -ml-3">
        <span className="unslant text-data text-[11px] font-semibold tracking-[0.2em]">HIDDEN GEMS</span>
      </div>
      <div className="flex-1 overflow-x-auto no-scrollbar group">
        <div className="ticker-track flex w-max animate-ticker group-hover:[animation-play-state:paused] py-2">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  )
}