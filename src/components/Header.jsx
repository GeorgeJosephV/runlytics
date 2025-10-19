import React from 'react'

export default function Header(){
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Runlytics</h1>
        <div className="text-sm text-gray-600">Leaderboard Dashboard</div>
      </div>
    </header>
  )
}