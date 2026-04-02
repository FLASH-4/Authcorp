'use client'

import { useState } from 'react'

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setError(null)
    if (!input.trim()) return
    const prompt = input.trim()
    setMessages((m) => [...m, { role: 'user', content: prompt }])
    setInput('')
    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Assistant error')
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch (e: any) {
      setError(String(e.message || e))
    }
  }

  return (
    <div className="mobile-container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">AI Assistant</h1>
      <div className="space-y-4 max-w-2xl">
        <div className="space-y-2 glass-card p-3 h-64 overflow-auto">
          {messages.length === 0 && (
            <p className="text-sm text-gray-300">Start the conversation by asking a question…</p>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'text-white' : 'text-blue-300'}>
              <span className="text-xs font-semibold mr-2">{m.role === 'user' ? 'You' : 'Assistant'}:</span>
              <span className="text-sm">{m.content}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <input
            className="flex-1 border border-white/10 bg-white/5 rounded px-3 py-2 text-sm text-white placeholder:text-gray-400"
            placeholder="Ask something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn-cyber" onClick={send}>Send</button>
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
      </div>
    </div>
  )
}