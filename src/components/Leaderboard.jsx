import React, { useMemo, useState, useEffect } from "react";

function parseTimeToSeconds(t) {
  if (!t) return null;
  if (typeof t === "number") return t;
  const parts = String(t).split(":").map(Number);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export default function Leaderboard({ rows, onVisibleChange }) {
  const distances = useMemo(() => {
    const s = new Set(
      rows
        .map((r) => r.Distance || (r.DistanceKm ? `${r.DistanceKm}km` : ""))
        .filter(Boolean),
    );
    return [...s];
  }, [rows]);

  const [selected, setSelected] = useState(distances[0] || "");
  const [sortBy, setSortBy] = useState("Time");
  const [sortDir, setSortDir] = useState("asc");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesDistance = selected
        ? r.Distance === selected || `${r.DistanceKm}km` === selected
        : true;
      const name = (r.Name || r.Runner || r.Athlete || "").toLowerCase();
      const matchesQuery = query.trim()
        ? name.includes(query.toLowerCase())
        : true;
      return matchesDistance && matchesQuery;
    });
  }, [rows, selected, query]);

  const enriched = useMemo(() => {
    return filtered.map((r) => {
      const timeSeconds =
        r.TimeSeconds ??
        parseTimeToSeconds(r.Time || r["Best Time"] || r["Time"]);
      const distanceKm =
        r.DistanceKm ??
        (r.Distance
          ? Number(r.Distance) >= 100
            ? Number(r.Distance) / 1000
            : Number(r.Distance)
          : null);
      const pace =
        r.PaceMinPerKm ??
        (timeSeconds && distanceKm
          ? Number((timeSeconds / 60 / distanceKm).toFixed(2))
          : null);
      const avgSpeed =
        r.AvgSpeedKmH ??
        (timeSeconds && distanceKm
          ? Number((distanceKm / (timeSeconds / 3600)).toFixed(2))
          : null);
      return {
        ...r,
        timeSeconds,
        distanceKm,
        pace,
        avgSpeed,
      };
    });
  }, [filtered]);

  // sorting
  const sorted = useMemo(() => {
    const arr = [...enriched];
    const key =
      sortBy === "Time"
        ? "timeSeconds"
        : sortBy === "Pace"
          ? "pace"
          : "avgSpeed";
    arr.sort((a, b) => {
      const va = a[key] ?? 1e9;
      const vb = b[key] ?? 1e9;
      return (va - vb) * (sortDir === "asc" ? 1 : -1);
    });
    return arr;
  }, [enriched, sortBy, sortDir]);

  // report visible rows to parent whenever sorted changes
  useEffect(() => {
    if (onVisibleChange) onVisibleChange(sorted);
  }, [sorted, onVisibleChange]);

  // top 3 cards for selected distance (best performers by current metric)
  const top3 = useMemo(() => {
    const key =
      sortBy === "Time"
        ? "timeSeconds"
        : sortBy === "Pace"
          ? "pace"
          : "avgSpeed";
    const direction = sortBy === "AvgSpeed" ? -1 : 1;
    return [...enriched]
      .sort((a, b) => {
        const va = a[key] ?? (direction === 1 ? 1e9 : -1e9);
        const vb = b[key] ?? (direction === 1 ? 1e9 : -1e9);
        return direction * (va - vb);
      })
      .slice(0, 3);
  }, [enriched, sortBy]);

  const visibleTop3 = sortDir === "asc" ? top3 : [...top3].reverse();

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  // Avatar component with error fallback
  function Avatar({ src, name, size = 40 }) {
    const [loaded, setLoaded] = useState(true);
    const initial = (name || "?").charAt(0).toUpperCase();

    if (!src || !loaded) {
      return (
        <div
          style={{ width: size, height: size }}
          className="rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white"
        >
          {initial}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={`${name} avatar`}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white/30"
        onError={() => setLoaded(false)}
      />
    );
  }

  // small helper to format pace/speed
  const compact = (n, unit) => {
    if (n == null) return "-";
    if (unit === "min/km") {
      const min = Math.floor(n);
      const sec = Math.round((n - min) * 60);
      return `${min}:${sec.toString().padStart(2, "0")} ${unit}`;
    }
    return `${n} ${unit}`;
  };

  return (
    <div>
      {/* stacked on mobile, inline on >=sm */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-yellow-50 rounded-full shadow-sm px-3 py-1 w-full sm:w-auto">
            <svg
              className="w-5 h-5 text-orange-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 12h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="custom-select bg-transparent outline-none text-sm text-[var(--text)] w-full sm:w-auto"
              aria-label="Select distance"
            >
              <option value="">All distances</option>
              {distances.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 sm:flex-none flex items-center gap-2">
            <div className="text-sm text-[var(--muted)] hidden sm:block">
              Sort:
            </div>
            {/* allow horizontal scroll on very small screens; prevent overlap by using min-width + no shrink */}
            <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar w-full sm:w-auto items-center">
              {["Time", "AvgSpeed"].map((col) => {
                const label = col === "AvgSpeed" ? "Avg Speed" : col;
                return (
                  <button
                    key={col}
                    onClick={() => toggleSort(col)}
                    className={`flex-shrink-0 min-w-[96px] sm:min-w-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${sortBy === col ? "bg-orange-500 text-white shadow" : "bg-white/90 dark:bg-black/20 text-gray-800 dark:text-white border"}`}
                    aria-pressed={sortBy === col}
                  >
                    {label}
                    {sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <input
              placeholder="Search runner"
              className="border px-10 py-3 rounded-full text-sm shadow-sm w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search runners"
            />
          </div>
        </div>
      </div>

      {/* Top 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 mt-4 sm:mt-6">
        {visibleTop3.map((r, i) => {
          const tileClass =
            i === 0
              ? sortDir === "asc"
                ? "top3-tile top3-gold"
                : "top3-tile top3-bronze"
              : i === 1
                ? "top3-tile top3-silver"
                : sortDir === "asc"
                  ? "top3-tile top3-bronze"
                  : "top3-tile top3-gold";

          return (
            <div key={i} className={tileClass}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {i === 0
                    ? sortDir === "asc"
                      ? "Gold"
                      : "Bronze"
                    : i === 1
                      ? "Silver"
                      : sortDir === "asc"
                        ? "Bronze"
                        : "Gold"}
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                  <b>
                    {r.Distance || (r.distanceKm ? `${r.distanceKm}km` : "")}
                  </b>
                </div>
              </div>
              <div className="mt-2 text-lg font-extrabold flex items-center gap-3">
                <Avatar
                  src={r.PhotoUrl}
                  name={r.Name || r.Runner || r.Athlete}
                  size={44}
                />
                <div>{r.Name || r.Runner || r.Athlete}</div>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-current/90"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M12 7v6l4 2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{r.Time || "-"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-current/90"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <circle cx="13" cy="3" r="1.2" />
                    <path d="M13 4.5l-1 4" />
                    <path d="M12 6.5l3 1-1 3" /> <path d="M12 6.5l-3 0-1 3" />{" "}
                    <path d="M12 8.5l-1 3" />
                    <path d="M11 11.5l4 1 0 4.5" />{" "}
                    <path d="M11 11.5l-2 4-3 1" />{" "}
                  </svg>
                  <span>
                    <b>{compact(r.pace, "min/km")}</b>
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs">{`Avg Speed: ${compact(r.avgSpeed, "km/h")}`}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div>
          <table className="w-full table-fixed text-xs sm:text-sm">
            <colgroup>
              <col className="w-[8%] sm:w-[7%]" />
              <col className="w-[36%] sm:w-[31%]" />
              <col className="w-[15%] sm:w-[17%]" />
              <col className="w-[19%] sm:w-[22%]" />
              <col className="w-[22%] sm:w-[23%]" />
            </colgroup>
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="px-2 py-3 sm:p-3">#</th>
                <th className="px-2 py-3 sm:p-3">Name</th>
                <th
                  className="px-2 py-3 sm:p-3 cursor-pointer break-words"
                  onClick={() => toggleSort("Time")}
                >
                  Time
                </th>
                <th className="px-2 py-3 sm:p-3 break-words">
                  <span className="sm:hidden">Pace</span>
                  <span className="hidden sm:inline">Pace (min/km)</span>
                </th>
                <th
                  className="px-2 py-3 sm:p-3 cursor-pointer break-words"
                  onClick={() => toggleSort("AvgSpeed")}
                >
                  <span className="sm:hidden">Avg</span>
                  <span className="hidden sm:inline">Avg Speed</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr
                  key={i}
                  className="border-b hover:scale-[1.005] hover:shadow-sm transition"
                >
                  <td className="px-2 py-3 sm:p-3 font-semibold align-top">
                    {i + 1}
                  </td>
                  <td className="px-2 py-3 sm:p-3 align-top">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        <Avatar
                          src={r.PhotoUrl}
                          name={r.Name || r.Runner || r.Athlete}
                          size={32}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium leading-snug break-words">
                          {r.Name || r["Runner"] || r["Athlete"]}
                        </div>
                        <div className="text-[11px] sm:text-xs text-[var(--muted)] leading-snug break-words">
                          {r.Distance ||
                            (r.distanceKm ? `${r.distanceKm} km` : "")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 sm:p-3 align-top break-words leading-snug">
                    {r.Time || "-"}
                  </td>
                  <td className="px-2 py-3 sm:p-3 align-top break-words leading-snug">
                    {compact(r.pace, "min/km")}
                  </td>
                  <td className="px-2 py-3 sm:p-3 align-top break-words leading-snug">
                    {r.avgSpeed ? `${r.avgSpeed} km/h` : r.AvgSpeed || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
