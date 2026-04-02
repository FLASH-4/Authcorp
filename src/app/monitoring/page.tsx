'use client'

import { useEffect, useState } from 'react'
import { useRealTimeStats, useRecentActivity, useSystemHealth } from '@/lib/data-service'

export default function MonitoringPage() {
  const [stats, setStats] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    useRealTimeStats().then((s) => mounted && setStats(s))
    useSystemHealth().then((h) => mounted && setHealth(h))
    useRecentActivity(10).then((a) => mounted && setActivity(a))
    return () => { mounted = false }
  }, [])

  return (
    <div className="mobile-container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">Continuous Monitoring</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <h2 className="font-medium mb-2 text-white">System Health</h2>
          {!health && <p className="text-sm text-gray-500">Loading…</p>}
          {health && (
            <ul className="text-sm space-y-1 text-gray-300">
              <li>AI Engine: <span className="font-semibold">{health.aiEngine}</span></li>
              <li>Database: <span className="font-semibold">{health.database}</span></li>
              <li>Risk Intel API: <span className="font-semibold">{health.riskIntelApi}</span></li>
              <li>Blockchain: <span className="font-semibold">{health.blockchainService}</span></li>
            </ul>
          )}
        </div>
        <div className="glass-card p-4">
          <h2 className="font-medium mb-2 text-white">Real-time Stats</h2>
          {!stats && <p className="text-sm text-gray-500">Loading…</p>}
          {stats && (
            <ul className="text-sm space-y-1 text-gray-300">
              <li>Documents Processed: <span className="font-semibold">{stats.documentsProcessed}</span></li>
              <li>Authenticity Rate: <span className="font-semibold">{stats.authenticityRate}%</span></li>
              <li>High Risk Flags: <span className="font-semibold">{stats.highRiskFlags}</span></li>
              <li>System Status: <span className="font-semibold">{stats.systemStatus}</span></li>
            </ul>
          )}
        </div>
        <div className="glass-card p-4">
          <h2 className="font-medium mb-2 text-white">Recent Activity</h2>
          {activity.length === 0 && <p className="text-sm text-gray-500">No recent activity</p>}
          <ul className="text-sm space-y-1 max-h-48 overflow-auto text-gray-300">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.type}: {a.document}</span>
                <span className="text-gray-400">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}