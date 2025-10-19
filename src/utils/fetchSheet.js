import Papa from 'papaparse'

const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1MXJw3BKQBbV3tIMMwi137FE7HQK8BSKhYmfZHUjk_ck'
const GID = 0
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`

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
          // try to compute numeric time seconds if column exists
          if (obj.Time) {
            const parts = String(obj.Time).split(':').map(Number)
            let secs = null
            if (parts.length === 1) secs = parts[0]
            else if (parts.length === 2) secs = parts[0]*60 + parts[1]
            else if (parts.length === 3) secs = parts[0]*3600 + parts[1]*60 + parts[2]
            obj.TimeSeconds = secs
          }
          return obj
        })
        resolve(rows)
      },
      error: err => reject(err)
    })
  })
}