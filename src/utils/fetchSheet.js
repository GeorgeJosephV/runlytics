import Papa from 'papaparse'

const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1MXJw3BKQBbV3tIMMwi137FE7HQK8BSKhYmfZHUjk_ck'
const GID = 0
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`

function parseDistanceToKm(d){
  if (!d && d !== 0) return null
  const s = String(d).trim().toLowerCase()
  // Examples: "1km", "1000 m", "400", "0.4 km", "1500m"
  const m = s.match(/([\d,.]+)\s*(km|m)?/)
  if (!m) return null
  let val = Number(m[1].replace(',', '.'))
  const unit = m[2] || ''
  if (unit === 'km') return val
  if (unit === 'm') return val / 1000
  // no unit: heuristics -> treat values >= 100 as meters, else km
  if (val >= 100) return val / 1000
  return val
}

export async function fetchSheetAsJson(){
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error('Failed to fetch sheet: ' + res.status)
  const text = await res.text()
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        // Normalize header keys: trim and remove extra spaces
        const rows = results.data.map(r => {
          const obj = {}
          Object.keys(r).forEach(k => {
            const newKey = k.trim()
            obj[newKey] = r[k].trim ? r[k].trim() : r[k]
          })

          // compute TimeSeconds from Time-like columns
          if (obj.Time || obj['Time'] || obj['Best Time']) {
            debugger;
            const t = (obj.Time || obj['Best Time'] || obj['Time']).replace(' mins','')
            const parts = String(t).split(':').map(Number)
            let secs = null
            if (parts.length === 1) secs = parts[0]
            else if (parts.length === 2) secs = parts[0]*60 + parts[1]
            else if (parts.length === 3) secs = parts[0]*3600 + parts[1]*60 + parts[2]
            obj.TimeSeconds = secs
          }

          // normalize/parse distance -> DistanceKm
          const distRaw = obj.Distance || obj['Distance (m)'] || obj['DistanceKm']
          const km = parseDistanceToKm(distRaw)
          if (km != null) obj.DistanceKm = km

          // compute Pace (min/km) and AvgSpeed (km/h) if possible
          if (obj.TimeSeconds != null && obj.DistanceKm && obj.DistanceKm > 0) {
            const timeMinutes = Number(obj.TimeSeconds) / 60
            const timeHours = Number(obj.TimeSeconds) / 3600
            const pace = timeMinutes / Number(obj.DistanceKm) // min per km
            const speed = Number(obj.DistanceKm) / timeHours // km per hour
            obj.PaceMinPerKm = Number.isFinite(pace) ? Number(pace.toFixed(2)) : null
            obj.AvgSpeedKmH = Number.isFinite(speed) ? Number(speed.toFixed(2)) : null
          }

          return obj
        })
        resolve(rows)
      },
      error: err => reject(err)
    })
  })
}