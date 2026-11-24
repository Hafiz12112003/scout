const SKIP = new Set(['FC', 'AFC', 'AC', 'SSC', 'AS', 'SC', 'CF'])

function initials(name) {
  const words = String(name || '?')
    .split(/\s+/)
    .filter((w) => w && !SKIP.has(w.toUpperCase()))
  const src = words.length ? words : [String(name || '?')]
  return src
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function short(name, max = 17) {
  const s = String(name || '')
  return s.length > max ? `${s.slice(0, max - 1)}...` : s
}

function layout(n) {
  if (n === 1) return [{ x: 400, y: 240 }]
  return Array.from({ length: n }, (_, i) => ({
    x: 90 + (i * 620) / (n - 1),
    y: i % 2 === 0 ? 175 : 305,
  }))
}

export function stepSegments(a, b) {
  const club = a.kind === 'Club' ? a : b.kind === 'Club' ? b : null
  const player = a.kind === 'Player' ? a : b.kind === 'Player' ? b : null
  const other = [a, b].find((n) => n !== club && n !== player)
  if (club && player) return [{ t: player.name, s: true }, { t: ' played for ' }, { t: club.name, s: true }]
  if (club && other) return [{ t: club.name, s: true }, { t: ' is managed by ' }, { t: other.name, s: true }]
  if (player && other) return [{ t: player.name, s: true }, { t: ' was managed by ' }, { t: other.name, s: true }]
  return [{ t: a.name, s: true }, { t: ' is linked to ' }, { t: b.name, s: true }]
}

export function ChainSteps({ chain }) {
  if (!chain || chain.length < 2) return null
  return (
    <ol className="space-y-2">
      {chain.slice(0, -1).map((node, i) => (
        <li
          key={i}
          className="reveal flex items-baseline gap-4 border-b border-edge pb-2 last:border-0"
          style={{ '--i': Math.min(i, 8) }}
        >
          <span className="text-data text-xs text-volt w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
          <span className="text-sm text-mute">
            {stepSegments(node, chain[i + 1]).map((seg, j) => (
              <span key={j} className={seg.s ? 'text-chalk font-medium' : ''}>
                {seg.t}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function PitchMap({ chain }) {
  if (!chain || chain.length === 0) return null
  const pts = layout(chain.length)
  const label = chain.map((n) => n.name).join(', then ')
  const last = chain.length - 1
  const lineColor = '#2A3A47'

  return (
    <div>
      <div className="overflow-x-auto no-scrollbar">
        <svg
          viewBox="0 0 800 480"
          className="w-full min-w-[640px] block"
          role="img"
          aria-label={`Connection map: ${label}`}
        >
          {/* mown bands */}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={20 + i * 95} y="20" width="95" height="440" fill={i % 2 ? '#0A1017' : '#0D141B'} />
          ))}
          {/* markings */}
          <g fill="none" stroke={lineColor} strokeWidth="2">
            <rect x="20" y="20" width="760" height="440" />
            <line x1="400" y1="20" x2="400" y2="460" />
            <circle cx="400" cy="240" r="60" />
            <rect x="20" y="130" width="120" height="220" />
            <rect x="20" y="195" width="40" height="90" />
            <rect x="660" y="130" width="120" height="220" />
            <rect x="740" y="195" width="40" height="90" />
          </g>
          <circle cx="400" cy="240" r="3" fill={lineColor} />

          {/* routes */}
          {pts.slice(0, -1).map((p, i) => (
            <line
              key={`e${i}`}
              x1={p.x}
              y1={p.y}
              x2={pts[i + 1].x}
              y2={pts[i + 1].y}
              stroke="#C8FF3C"
              strokeWidth="2"
              strokeOpacity="0.75"
              className="route-dash"
            />
          ))}

          {/* nodes */}
          {chain.map((node, i) => {
            const p = pts[i]
            const isLast = i === last
            const up = p.y < 240
            const ly = up ? -40 : 52
            return (
              <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                <g className="reveal" style={{ '--i': i }}>
                  {node.kind === 'Club' && (
                    <>
                      <circle r="23" fill={i === 0 ? '#C8FF3C' : '#121C25'} stroke="#C8FF3C" strokeWidth="2" />
                      <text
                        textAnchor="middle"
                        dy="5"
                        fontSize="14"
                        fontFamily="'Barlow Condensed', sans-serif"
                        fontStyle="italic"
                        fontWeight="800"
                        fill={i === 0 ? '#06090D' : '#EEF2F5'}
                      >
                        {initials(node.name)}
                      </text>
                    </>
                  )}
                  {node.kind !== 'Club' && node.kind !== 'Player' && (
                    <>
                      <polygon points="0,-27 27,0 0,27 -27,0" fill="#121C25" stroke="#FFB020" strokeWidth="2" />
                      <text
                        textAnchor="middle"
                        dy="5"
                        fontSize="13"
                        fontFamily="'Barlow Condensed', sans-serif"
                        fontStyle="italic"
                        fontWeight="800"
                        fill="#FFB020"
                      >
                        {initials(node.name)}
                      </text>
                    </>
                  )}
                  {node.kind === 'Player' && (
                    <>
                      {isLast && (
                        <circle
                          r="26"
                          fill="none"
                          stroke="#C8FF3C"
                          strokeWidth="2"
                          className="animate-ring"
                          style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                        />
                      )}
                      <circle r="26" fill="#06090D" stroke={isLast ? '#C8FF3C' : '#6E8091'} strokeWidth="2" />
                      <circle r="16" fill="none" stroke={isLast ? '#C8FF3C' : '#6E8091'} strokeWidth="1.5" />
                      <circle r="6" fill={isLast ? '#C8FF3C' : '#6E8091'} />
                      <line x1="-32" y1="0" x2="-20" y2="0" stroke={isLast ? '#C8FF3C' : '#6E8091'} strokeWidth="1.5" />
                      <line x1="20" y1="0" x2="32" y2="0" stroke={isLast ? '#C8FF3C' : '#6E8091'} strokeWidth="1.5" />
                    </>
                  )}
                  <text
                    textAnchor="middle"
                    y={ly}
                    fontSize="12"
                    fontFamily="'IBM Plex Sans', sans-serif"
                    fontWeight="500"
                    fill="#EEF2F5"
                  >
                    {short(node.name)}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-data text-[10px] tracking-[0.18em] text-mute">
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true">
            <circle r="6" fill="none" stroke="#C8FF3C" strokeWidth="2" />
          </svg>
          CLUB
        </span>
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true">
            <polygon points="0,-7 7,0 0,7 -7,0" fill="none" stroke="#FFB020" strokeWidth="2" />
          </svg>
          MANAGER
        </span>
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true">
            <circle r="6" fill="none" stroke="#6E8091" strokeWidth="1.5" />
            <circle r="2" fill="#6E8091" />
          </svg>
          PLAYER
        </span>
      </div>
    </div>
  )
}