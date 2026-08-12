export function LoadingState({ label = 'Querying the graph' }) {
  return (
    <div className="flex items-center gap-3 py-12 justify-center text-slate-muted">
      <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
      <span className="text-data text-sm">{label}...</span>
    </div>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="py-16 text-center border border-dashed border-pitch-line rounded">
      <p className="text-display text-xl text-chalk mb-1">{title}</p>
      {hint && <p className="text-sm text-slate-muted">{hint}</p>}
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="py-8 px-5 border border-floodlight-dim bg-pitch-surface rounded">
      <p className="text-data text-sm text-floodlight mb-1">QUERY FAILED</p>
      <p className="text-sm text-slate-muted">{message}</p>
    </div>
  )
}
