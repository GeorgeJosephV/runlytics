import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import Leaderboard from './components/Leaderboard'
import Charts from './components/Charts'
import { fetchSheetAsJson } from './utils/fetchSheet'

export default function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // new: rows currently shown in the grid -> used by Charts
  const [visibleRows, setVisibleRows] = useState([])

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
    <div className="min-h-screen futuristic-root">
      <Header />
      <main className="w-full">
        <div className="w-full max-w-6xl mx-auto p-4">
          {loading && <div className="text-center py-16">Loading…</div>}
          {error && <div className="text-red-600">Error: {error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* pass setter so Leaderboard can report its visible rows */}
                <Leaderboard rows={data} onVisibleChange={setVisibleRows} />
              </div>
              <div>
                {/* Charts now receive only the rows visible in the grid */}
                <Charts rows={visibleRows.length ? visibleRows : data} allRows={data} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}