import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import TopBar from './components/TopBar'
import Landing from './pages/Landing'
import PlayerDetail from './pages/PlayerDetail'
import ClubDetail from './pages/ClubDetail'
import Explore from './pages/Explore'
import { api } from './api'

export default function App() {
  const [dbStatus, setDbStatus] = useState('checking')

  useEffect(() => {
    api
      .health()
      .then((data) => setDbStatus(data.database_connected ? 'connected' : 'down'))
      .catch(() => setDbStatus('down'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      {dbStatus === 'down' && (
        <div className="bg-floodlight-dim/20 border-b border-floodlight-dim px-6 py-2.5 text-center">
          <p className="text-data text-xs text-floodlight">
            GRAPH UNREACHABLE — the backend can't reach CognoDB right now. Data may be stale or unavailable.
          </p>
        </div>
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/player/:name" element={<PlayerDetail />} />
          <Route path="/club/:name" element={<ClubDetail />} />
          <Route path="/explore" element={<Explore />} />
        </Routes>
      </main>

      <footer className="border-t border-pitch-line py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-data text-xs text-slate-muted">SCOUT · GRAPH INTELLIGENCE</p>
          <p className="text-data text-xs text-slate-muted flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'connected' ? 'bg-live' : dbStatus === 'down' ? 'bg-floodlight' : 'bg-slate-muted'
              }`}
            />
            {dbStatus === 'connected' ? 'GRAPH CONNECTED' : dbStatus === 'down' ? 'GRAPH OFFLINE' : 'CONNECTING'}
          </p>
        </div>
      </footer>
    </div>
  )
}
