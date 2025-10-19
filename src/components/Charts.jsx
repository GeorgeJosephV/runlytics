import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid, Area
} from 'recharts'

export default function Charts({ rows = [], allRows = [] }) {
  const formatSeconds = (s) => {
    if (s == null || !isFinite(s)) return '-'
    const sec = Math.round(s)
    const mm = Math.floor(sec / 60)
    const ss = sec % 60
    return `${mm}:${String(ss).padStart(2, '0')}`
  }

  const COLORS = ['#06b6d4', '#f97316', '#facc15', '#10b981', '#ef4444', '#8b5cf6', '#7c3aed', '#06b6d4']
  const GOLD = '#ffd700'
  const SILVER = '#c0c0c0'
  const BRONZE = '#cd7f32'
  const NEUTRAL = '#94a3b8'

  // --- grouped bar data (best times per athlete per distance) ---
  const { byDistance, athletes, rankMap } = useMemo(() => {
    const distancesSet = new Set()
    const athletesSet = new Set()
    const map = {} // map[distance][athlete]=bestTime

    rows.forEach((r) => {
      const distance = (r.Distance || (r.DistanceKm ? `${r.DistanceKm}km` : 'unknown')).toString()
      distancesSet.add(distance)
      const name = (r.Name || r.Runner || r.Athlete || 'Unknown').toString().trim()
      athletesSet.add(name)

      const tRaw = Number(r.timeSeconds ?? r.TimeSeconds ?? r.Time ?? NaN)
      const t = isFinite(tRaw) ? tRaw : null
      if (!map[distance]) map[distance] = {}
      if (t == null) return
      const cur = map[distance][name]
      if (cur == null || t < cur) map[distance][name] = t
    })

    const distances = Array.from(distancesSet).sort((a,b) => {
      const na = parseFloat(a)
      const nb = parseFloat(b)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })

    const athletesArr = Array.from(athletesSet)

    // build rank map: distance -> { athlete: rank }
    const rankMapLocal = {}
    distances.forEach(dist => {
      const entries = Object.entries(map[dist] || {}).filter(([,v]) => isFinite(v))
      entries.sort((a,b) => a[1] - b[1]) // ascending (best first)
      rankMapLocal[dist] = {}
      entries.forEach(([ath, ,], idx) => {
        rankMapLocal[dist][ath] = idx + 1
      })
    })

    const chartData = distances.map(dist => {
      const point = { distance: dist }
      athletesArr.forEach(a => {
        point[a] = map[dist] && map[dist][a] != null ? map[dist][a] : null
      })
      return point
    })

    return { byDistance: chartData, athletes: athletesArr, rankMap: rankMapLocal }
  }, [rows])

  // --- time series per athlete (best per date) ---
  const timeSeries = useMemo(() => {
    const dateSet = new Set()
    const athletesSet = new Set()

    const parsed = rows.map((r, idx) => {
      const name = (r.Name || r.Runner || r.Athlete || 'Unknown').toString().trim()
      athletesSet.add(name)

      const rawDate = r.date ?? r.Date ?? r.DateString ?? (r.raw && (r.raw.date || r.raw.Date)) ?? ''
      let label = ''
      if (rawDate) {
        const d = new Date(rawDate)
        if (!isNaN(d)) label = d.toISOString().slice(0, 10)
        else label = String(rawDate).trim()
      } else {
        label = `run-${idx + 1}`
      }
      dateSet.add(label)

      const tRaw = Number(r.timeSeconds ?? r.TimeSeconds ?? r.Time ?? NaN)
      const t = isFinite(tRaw) ? tRaw : null

      return { name, label, t }
    })

    const dates = Array.from(dateSet).sort()
    const athletesArr = Array.from(athletesSet)

    const map = {}
    parsed.forEach(p => {
      if (!map[p.label]) map[p.label] = {}
      if (p.t == null) return
      const cur = map[p.label][p.name]
      if (cur == null || p.t < cur) map[p.label][p.name] = p.t
    })

    const data = dates.map(date => {
      const point = { date }
      athletesArr.forEach(a => {
        point[a] = map[date] && map[date][a] != null ? map[date][a] : null
      })
      return point
    })

    return { data, athletes: athletesArr }
  }, [rows])

  // --- golds across allRows (unchanged) ---
  const goldData = useMemo(() => {
    const counts = {}
    const mapAll = {}
    const athletesAllSet = new Set()

    allRows.forEach((r) => {
      const distance = (r.Distance || (r.DistanceKm ? `${r.DistanceKm}km` : 'unknown')).toString()
      const name = (r.Name || r.Runner || r.Athlete || 'Unknown').toString().trim()
      athletesAllSet.add(name)
      const tRaw = Number(r.timeSeconds ?? r.TimeSeconds ?? r.Time ?? NaN)
      const t = isFinite(tRaw) ? tRaw : null
      if (!mapAll[distance]) mapAll[distance] = {}
      if (t == null) return
      const cur = mapAll[distance][name]
      if (cur == null || t < cur) mapAll[distance][name] = t
    })

    const athletesAll = Array.from(athletesAllSet)
    Object.entries(mapAll).forEach(([distance, athleteMap]) => {
      let min = Infinity
      const winners = []
      athletesAll.forEach(a => {
        const v = athleteMap[a]
        if (v == null) return
        if (v < min) { min = v; winners.length = 0; winners.push(a) }
        else if (v === min) { winners.push(a) }
      })
      if (!isFinite(min)) return
      winners.forEach(w => { counts[w] = (counts[w] || 0) + 1 })
    })

    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  }, [allRows])

  // --- custom tooltip with modern card ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div style={{
        background: 'var(--card-bg)', padding: 12, borderRadius: 10,
        boxShadow: '0 10px 30px rgba(2,6,23,0.35)', color: 'var(--text)', fontSize: 13
      }}>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => {
          if (p.value == null) return null
          const color = p.color || COLORS[i % COLORS.length]
          return (
            <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 4, background: color }} />
              <div style={{ flex: 1 }}>{p.name}</div>
              <div style={{ fontWeight: 700 }}>{formatSeconds(p.value)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gold medals first (always all distances) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Gold medals by athlete (ALL DISTANCES)</h3>
        <div className="text-xs text-[var(--muted)] mb-2">Note: this chart always shows 1st-place counts across all distances regardless of the grid filter.</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={goldData} dataKey="value" nameKey="name" outerRadius={86} innerRadius={48} paddingAngle={2} >
                {goldData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} gold${v===1?'':'s'}`, 'Golds']} />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-[var(--muted)] mt-2">Counts of 1st-place finishes per distance (ties count for each tied athlete).</div>
      </div>

      {/* Grouped bar chart: color bars by rank (gold/silver/bronze/neutral) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Best time by distance — all visible athletes</h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={byDistance} margin={{ right: 30 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="distance" tick={{ fill: 'var(--muted)' }} />
              <YAxis tickFormatter={formatSeconds} tick={{ fill: 'var(--muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 6 }} />
              {athletes.map((ath, idx) => (
                <Bar key={ath} dataKey={ath} name={ath} maxBarSize={36} radius={[6,6,6,6]} >
                  {byDistance.map((entry, eidx) => {
                    const dist = entry.distance
                    const rank = rankMap[dist] && rankMap[dist][ath] ? rankMap[dist][ath] : null
                    const fill = rank === 1 ? GOLD : rank === 2 ? SILVER : rank === 3 ? BRONZE : NEUTRAL
                    return <Cell key={`cell-${eidx}-${idx}`} fill={fill} />
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-[var(--muted)] mt-2">Bars colored by rank: gold / silver / bronze for top 3, neutral otherwise.</div>
      </div>

      {/* Line chart stays last */}
      <div className="card">
        <h3 className="font-semibold mb-2">Times by athlete over dates (filtered)</h3>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={timeSeries.data} margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted)' }} />
              <YAxis tickFormatter={formatSeconds} tick={{ fill: 'var(--muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 8 }} />
              {timeSeries.athletes.map((ath, idx) => (
                <React.Fragment key={ath}>
                  <Line
                    type="monotone"
                    dataKey={ath}
                    name={ath}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                    isAnimationActive={true}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={ath}
                    fillOpacity={0.08}
                    stroke="none"
                    fill={COLORS[idx % COLORS.length]}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-[var(--muted)] mt-2">Lines show each athlete's best time per date. Lines are smoothed and interactive.</div>
      </div>
    </div>
  )
}