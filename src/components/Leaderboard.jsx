import React, { useMemo, useState } from 'react'

function parseTimeToSeconds(t) {
  // expect format mm:ss or hh:mm:ss or seconds as number
  if (!t) return null
  if (typeof t === 'number') return t
  const parts = String(t).split(':').map(Number)
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return parts[0]*60 + parts[1]
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]
  return null
}

export default function Leaderboard({ rows }){
  // assume rows are objects with columns: Name, Distance, Time, AvgSpeed, Pace, etc.
  const distances = useMemo(()=>{
    const s = new Set(rows.map(r => r.Distance).filter(Boolean))
    return [...s]
  }, [rows])

  const [selected, setSelected] = useState(distances[0] || '')
  const [sortBy, setSortBy] = useState('Time')

  const filtered = rows.filter(r => (selected ? r.Distance === selected : true))
  const enriched = filtered.map(r => ({
    ...r,
    timeSeconds: parseTimeToSeconds(r.Time || r['Best Time'] || r['Time(s)'])
  }))
  enriched.sort((a,b)=> (a.timeSeconds ?? 1e9) - (b.timeSeconds ?? 1e9))

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <div className="flex gap-2">
          <select value={selected} onChange={e=>setSelected(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">All distances</option>
            {distances.map(d=> <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="border px-2 py-1 rounded">
            <option>Time</option>
            <option>AvgSpeed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="p-2">Rank</th>
              <th className="p-2">Name</th>
              <th className="p-2">Time</th>
              <th className="p-2">Pace</th>
              <th className="p-2">Avg Speed</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((r,i)=> (
              <tr key={i} className="border-t">
                <td className="p-2">{i+1}</td>
                <td className="p-2">{r.Name || r['Runner'] || r['Athlete']}</td>
                <td className="p-2">{r.Time}</td>
                <td className="p-2">{r.Pace || '-'}</td>
                <td className="p-2">{r.AvgSpeed || r['Avg Speed'] || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}