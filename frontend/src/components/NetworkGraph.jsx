import { useEffect, useRef, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'

/**
 * Force-directed graph drawn as a broadcast tactics board.
 * Centre node = volt marker with a pulse ring. Edges = dashed routes with labels.
 */
export default function NetworkGraph({ nodes, edges, centerNodeId, height = 480 }) {
  const containerRef = useRef(null)
  const [positions, setPositions] = useState({})
  const [dimensions, setDimensions] = useState({ width: 800, height })
  const [hoveredNode, setHoveredNode] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return undefined
    const resize = () => {
      setDimensions({ width: containerRef.current.offsetWidth, height })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [height])

  useEffect(() => {
    if (!nodes.length) return
    const { width } = dimensions

    const simNodes = nodes.map((n) => ({ ...n }))
    const simLinks = edges.map((e) => ({ ...e }))

    const sim = forceSimulation(simNodes)
      .force('link', forceLink(simLinks).id((d) => d.id).distance(120).strength(0.6))
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(width / 2, dimensions.height / 2))
      .force('collide', forceCollide().radius((d) => (d.id === centerNodeId ? 46 : 32)))
      .stop()

    for (let i = 0; i < 220; i++) sim.tick()

    const posMap = {}
    simNodes.forEach((n) => {
      posMap[n.id] = { x: n.x, y: n.y }
    })
    setPositions(posMap)
  }, [nodes, edges, dimensions, centerNodeId])

  if (!nodes.length) return null

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
        role="img"
        aria-label="Network graph of connected players"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#C8FF3C" opacity="0.6" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const source = positions[edge.source]
          const target = positions[edge.target]
          if (!source || !target) return null
          const midX = (source.x + target.x) / 2
          const midY = (source.y + target.y) / 2
          return (
            <g key={i}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#C8FF3C"
                strokeWidth="1.5"
                strokeOpacity="0.35"
                className="route-dash"
                markerEnd="url(#arrow)"
              />
              {edge.label && (
                <g>
                  <rect
                    x={midX - edge.label.length * 3.2 - 4}
                    y={midY - 9}
                    width={edge.label.length * 6.4 + 8}
                    height="16"
                    fill="#06090D"
                    stroke="#1E2B36"
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="'IBM Plex Mono', monospace"
                    fill="#6E8091"
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {nodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null
          const isCenter = node.id === centerNodeId
          const isHovered = hoveredNode === node.id
          const radius = isCenter ? 26 : 18

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              {isCenter && (
                <circle
                  r={radius}
                  fill="none"
                  stroke="#C8FF3C"
                  strokeWidth="1.5"
                  className="animate-ring"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
              )}
              <circle
                r={radius}
                fill={isCenter ? '#C8FF3C' : '#121C25'}
                stroke={isCenter ? '#C8FF3C' : isHovered ? '#C8FF3C' : '#1E2B36'}
                strokeWidth={isHovered ? 2 : 1.5}
              />
              <text
                textAnchor="middle"
                dy="4"
                fontSize={isCenter ? 12 : 10}
                fontFamily="'Barlow Condensed', sans-serif"
                fontStyle="italic"
                fontWeight="800"
                fill={isCenter ? '#06090D' : '#EEF2F5'}
              >
                {initials(node.label)}
              </text>
              {(isHovered || isCenter) && (
                <g>
                  <rect
                    x={-node.label.length * 3.4}
                    y={radius + 6}
                    width={node.label.length * 6.8}
                    height="18"
                    fill="#0D141B"
                    stroke="#1E2B36"
                  />
                  <text
                    textAnchor="middle"
                    y={radius + 18}
                    fontSize="10"
                    fontFamily="'IBM Plex Sans', sans-serif"
                    fill="#EEF2F5"
                  >
                    {node.label}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}