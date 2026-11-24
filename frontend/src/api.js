const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  health: () => request('/api/health'),

  searchPlayers: (name, position = '') =>
    request(`/api/players/search?name=${encodeURIComponent(name)}&position=${encodeURIComponent(position)}`),

  getPlayer: (name) => request(`/api/players/${encodeURIComponent(name)}`),

  getTeammates: (name) => request(`/api/players/${encodeURIComponent(name)}/teammates`),

  getSimilarPlayers: (name) => request(`/api/players/${encodeURIComponent(name)}/similar`),

  searchClubs: (name) => request(`/api/clubs/search?name=${encodeURIComponent(name)}`),

  getSquad: (clubName) => request(`/api/clubs/${encodeURIComponent(clubName)}/squad`),

  getAgentClusters: (clubName) => request(`/api/clubs/${encodeURIComponent(clubName)}/agent-clusters`),

  getGraphStats: () => request('/api/network/stats'),

  scoutingChain: (player, targetClub, maxAge = 25) =>
    request(
      `/api/network/scouting-chain?player=${encodeURIComponent(player)}&target_club=${encodeURIComponent(targetClub)}&max_age=${maxAge}`
    ),

  shortestPath: (playerA, playerB) =>
    request(`/api/network/shortest-path?player_a=${encodeURIComponent(playerA)}&player_b=${encodeURIComponent(playerB)}`),

  managerLineage: (club) => request(`/api/network/manager-lineage?club=${encodeURIComponent(club)}`),

  graphExplore: (player) => request(`/api/network/graph-explore?player=${encodeURIComponent(player)}`),

  hiddenGems: ({ position = '', maxAge = 28, minValue = 5000000, limit = 20 } = {}) =>
    request(
      `/api/insights/hidden-gems?position=${encodeURIComponent(position)}&max_age=${maxAge}&min_value=${minValue}&limit=${limit}`
    ),

  modelCard: () => request('/api/insights/model-card'),

  reach: (club, player) =>
    request(`/api/insights/reach?club=${encodeURIComponent(club)}&player=${encodeURIComponent(player)}`),

  assistantExamples: () => request('/api/assistant/examples'),

  // Prefer the friendly "error" text over the technical "detail" for the assistant.
  assistantQuery: async (question) => {
    const res = await fetch(`${API_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
    return body
  },
}