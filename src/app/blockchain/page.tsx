'use client'

import { useState } from 'react'

export default function BlockchainAnchoringPage() {
  const [hash, setHash] = useState('')
  const [network, setNetwork] = useState<'ethereum' | 'polygon' | 'solana'>('ethereum')
  const [result, setResult] = useState<{ anchorId: string; network: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/blockchain/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ hash, network })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Anchor failed')
      setResult(data)
    } catch (e: any) {
      setError(String(e.message || e))
    }
  }

  return (
    <div className="mobile-container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">Blockchain Anchoring</h1>
      <div className="space-y-3 max-w-xl glass-card p-4">
        <input
          className="w-full border border-white/10 bg-white/5 rounded px-3 py-2 text-sm text-white placeholder:text-gray-400"
          placeholder="Document hash (e.g., SHA-256)"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
        />
        <select
          className="border border-white/10 bg-white/5 rounded px-3 py-2 text-sm text-white"
          value={network}
          onChange={(e) => setNetwork(e.target.value as any)}
        >
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="solana">Solana</option>
        </select>
        <button
          className="btn-cyber"
          onClick={submit}
          disabled={!hash}
        >
          Anchor
        </button>
        {result && (
          <div className="text-sm text-green-400">Anchored: {result.anchorId} on {result.network}</div>
        )}
        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}
      </div>
    </div>
  )
}