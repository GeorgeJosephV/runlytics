import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Charts({ rows }){
  const byDistance = useMemo(() => {
    const map = {}
    rows.forEach(r=>{
      const d = r.Distance || 'unknown'
      const t = Number(r.TimeSeconds) || null
      if (!map[d]) map[d] = []
      map[d].push(r)
    })
    // produce aggregated series with best times per distance
    return Object.entries(map).map(([distance, arr])=>({
      distance,
      best: Math.min(...arr.map(x=> x.TimeSeconds ? Number(x.TimeSeconds) : 1e9))
    }))
  }, [rows])

  // simple conversion for chart: if Time is mm:ss strings, Charts component might not parse — ideally preprocessing required
  const chartData = byDistance.map(d=>({ name: d.distance, best: d.best }))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Best time by distance</h3>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="best" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Sample progress chart</h3>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line dataKey="best" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}