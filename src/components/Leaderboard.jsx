import React, { useMemo, useState, useEffect } from 'react'

function parseTimeToSeconds(t) {
  if (!t) return null
  if (typeof t === 'number') return t
  const parts = String(t).split(':').map(Number)
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return parts[0]*60 + parts[1]
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]
  return null
}

export default function Leaderboard({ rows, onVisibleChange }){
  const distances = useMemo(()=>{
    const s = new Set(rows.map(r => r.Distance || (r.DistanceKm ? `${r.DistanceKm}km` : '')).filter(Boolean))
    return [...s]
  }, [rows])

  const [selected, setSelected] = useState(distances[0] || '')
  const [sortBy, setSortBy] = useState('Time')
  const [sortDir, setSortDir] = useState('asc')
  const [query, setQuery] = useState('')

  const filtered = rows.filter(r => {
    const matchesDistance = selected ? (r.Distance === selected || (`${r.DistanceKm}km`) === selected) : true
    const name = (r.Name || r.Runner || r.Athlete || '').toLowerCase()
    const matchesQuery = query.trim() ? name.includes(query.toLowerCase()) : true
    return matchesDistance && matchesQuery
  })

  const enriched = filtered.map(r => {
    const timeSeconds = r.TimeSeconds ?? parseTimeToSeconds(r.Time || r['Best Time'] || r['Time'])
    const distanceKm = r.DistanceKm ?? (r.Distance ? (Number(r.Distance) >= 100 ? Number(r.Distance)/1000 : Number(r.Distance)) : null)
    const pace = r.PaceMinPerKm ?? (timeSeconds && distanceKm ? Number((timeSeconds/60 / distanceKm).toFixed(2)) : null)
    const avgSpeed = r.AvgSpeedKmH ?? (timeSeconds && distanceKm ? Number((distanceKm / (timeSeconds/3600)).toFixed(2)) : null)
    return {
      ...r,
      timeSeconds,
      distanceKm,
      pace,
      avgSpeed
    }
  })

  // sorting
  const sorted = useMemo(()=>{
    const arr = [...enriched]
    const key = sortBy === 'Time' ? 'timeSeconds' : (sortBy === 'Pace' ? 'pace' : 'avgSpeed')
    arr.sort((a,b)=>{
      const va = a[key] ?? 1e9
      const vb = b[key] ?? 1e9
      return (va - vb) * (sortDir === 'asc' ? 1 : -1)
    })
    return arr
  }, [enriched, sortBy, sortDir])

  // report visible rows to parent whenever sorted changes
  useEffect(() => {
    if (onVisibleChange) onVisibleChange(sorted)
  }, [sorted, onVisibleChange])

  // top 3 cards for selected distance
  const top3 = sorted.slice(0,3)

  function toggleSort(column){
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  // small helper to format pace/speed
  const compact = (n, unit) => (n == null ? '-' : `${n} ${unit}`)

  return (
    <div>
      <div className="mb-4">
        {/* stacked on mobile, inline on >=sm */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-yellow-50 rounded-full shadow-sm px-3 py-1 w-full sm:w-auto">
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="custom-select bg-transparent outline-none text-sm text-[var(--text)] w-full sm:w-auto"
                aria-label="Select distance"
              >
                <option value="">All distances</option>
                {distances.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex-1 sm:flex-none flex items-center gap-2">
              <div className="text-sm text-[var(--muted)] hidden sm:block">Sort:</div>
              {/* allow horizontal scroll on very small screens; prevent overlap by using min-width + no shrink */}
              <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar w-full sm:w-auto items-center">
                {['Time','AvgSpeed'].map(col => {
                  const label = col === 'AvgSpeed' ? 'Avg Speed' : col
                  return (
                    <button
                      key={col}
                      onClick={()=>toggleSort(col)}
                      className={`flex-shrink-0 min-w-[96px] sm:min-w-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${sortBy===col ? 'bg-orange-500 text-white shadow' : 'bg-white/90 dark:bg-black/20 text-gray-800 dark:text-white border'}`}
                      aria-pressed={sortBy===col}
                    >
                      {label}{sortBy===col ? (sortDir==='asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" /></svg>
              <input
                placeholder="Search runner"
                className="border px-10 py-3 rounded-full text-sm shadow-sm w-full sm:w-64"
                value={query}
                onChange={e=>setQuery(e.target.value)}
                aria-label="Search runners"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {top3.map((r, i) => {
          const tileClass =
            i === 0 ? 'top3-tile top3-gold neon-pulse' :
            i === 1 ? 'top3-tile top3-silver neon-pulse' :
                      'top3-tile top3-bronze neon-pulse'

          return (
            <div key={i} className={tileClass}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{i === 0 ? 'Gold' : i === 1 ? 'Silver' : 'Bronze'}</div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                  {r.Distance || (r.distanceKm ? `${r.distanceKm}km` : '')}
                </div>
              </div>
              <div className="mt-2 text-lg font-extrabold flex items-center gap-3">
                {/* modern outline person icon */}
                <svg className="w-6 h-6 text-current/95" viewBox="0 0 24 24" fill="none"><path d="M12 5a2 2 0 100-4 2 2 0 000 4zM6 20a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>{r.Name || r.Runner || r.Athlete}</div>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-current/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{r.Time || '-'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-current/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M1 12h2M21 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{compact(r.pace, 'min/km')}</span>
                </div>
              </div>
              <div className="mt-2 text-xs">{`Avg: ${compact(r.avgSpeed, 'km/h')}`}</div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3">Name</th>
                <th className="p-3 cursor-pointer" onClick={()=>toggleSort('Time')}>Time</th>
                <th className="p-3">Pace</th>
                <th className="p-3 cursor-pointer" onClick={()=>toggleSort('AvgSpeed')}>Avg Speed</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r,i)=> (
                <tr key={i} className="border-b hover:scale-[1.005] hover:shadow-sm transition">
                  <td className="p-3 font-semibold">{i+1}</td>
                  <td className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-white font-bold">{(r.Name || r.Runner || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="font-medium">{r.Name || r['Runner'] || r['Athlete']}</div>
                      <div className="text-xs text-[var(--muted)]">{r.Distance || (r.distanceKm ? `${r.distanceKm} km` : '')}</div>
                    </div>
                  </td>
                  <td className="p-3">{r.Time || '-'}</td>
                  <td className="p-3">{r.pace ? `${r.pace} min/km` : (r.Pace || '-')}</td>
                  <td className="p-3">{r.avgSpeed ? `${r.avgSpeed} km/h` : (r.AvgSpeed || '-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}