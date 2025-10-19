import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import Leaderboard from './components/Leaderboard'
import Charts from './components/Charts'
import { fetchSheetAsJson } from './utils/fetchSheet'

export default function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchSheetAsJson()
      .then(rows => {
        setData(rows)
        setLoading(false)
      })
      .catch(err => { setError(err.message || String(err)); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto p-4">
        {loading && <div className="text-center py-16">Loading…</div>}
        {error && <div className="text-red-600">Error: {error}</div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Leaderboard rows={data} />
            </div>
            <div>
              <Charts rows={data} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}