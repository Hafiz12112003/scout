import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import TopBar from './components/TopBar'
import Landing from './pages/Landing'
import PlayerDetail from './pages/PlayerDetail'
import ClubDetail from './pages/ClubDetail'
import Explore from './pages/Explore'
import HiddenGems from './pages/HiddenGems'
import Ask from './pages/Ask'
import Reach from './pages/Reach'
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
        <div className="bg-flare/10 border-b border-flare-dim px-6 py-2.5 text-center" role="alert">
          <p className="text-data text-xs tracking-wider text-flare">
            GRAPH UNREACHABLE - the backend can't reach the database right now. Data may be stale or unavailable.
          </p>
        </div>
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/player/:name" element={<PlayerDetail />} />
          <Route path="/club/:name" element={<ClubDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/gems" element={<HiddenGems />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/reach" element={<Reach />} />
        </Routes>
      </main>

      <footer className="border-t border-edge py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-data text-[11px] tracking-[0.18em] text-mute">
            SCOUT / GRAPH INTELLIGENCE / DATA:{' '}
            <a
              className="text-chalk underline decoration-edge hover:decoration-volt"
              href="https://github.com/oladeeayo/pl-catalogue"
              target="_blank"
              rel="noreferrer"
            >
              OLADEEAYO/PL-CATALOGUE
            </a>
          </p>
          <p className="text-data text-[11px] tracking-[0.18em] text-mute flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 ${
                dbStatus === 'connected' ? 'bg-volt' : dbStatus === 'down' ? 'bg-flare' : 'bg-mute'
              }`}
              style={{ transform: 'skewX(-12deg)' }}
            />
            {dbStatus === 'connected' ? 'GRAPH CONNECTED' : dbStatus === 'down' ? 'GRAPH OFFLINE' : 'CONNECTING'}
          </p>
        </div>
      </footer>
    </div>
  )
}