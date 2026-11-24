export function LoadingState({ label = 'Querying the graph' }) {
  return (
    <div className="flex items-center gap-3 py-12 justify-center text-mute" role="status">
      <span className="w-2 h-2 bg-volt animate-pulse" style={{ transform: 'skewX(-12deg)' }} />
      <span className="text-data text-sm tracking-wider">{label}...</span>
    </div>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="py-16 text-center border border-dashed border-edge">
      <p className="text-display text-2xl text-chalk mb-1">{title}</p>
      {hint && <p className="text-sm text-mute">{hint}</p>}
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="tile tile-flare py-6 px-6" role="alert">
      <p className="text-data text-xs tracking-[0.18em] text-flare mb-1">QUERY FAILED</p>
      <p className="text-sm text-mute">{message}</p>
    </div>
  )
}