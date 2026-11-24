export function euro(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  const m = n / 1000000
  return `\u20ac${m.toFixed(m >= 10 ? 0 : 1)}M`
}