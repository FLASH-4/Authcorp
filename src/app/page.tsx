'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DocumentUpload } from '@/components/document-upload'
import { Dashboard } from '@/components/dashboard'
import { ForensicAnalysis } from '@/components/forensic-analysis'
import { RiskIntelligence } from '@/components/risk-intelligence'
import { FuturisticFeatures } from '@/components/futuristic-features'
import { Navigation } from '@/components/navigation'
import { Header } from '@/components/header'
import { 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  EyeIcon, 
  ChartBarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'

type ActiveView = 'dashboard' | 'upload' | 'forensics' | 'risk-intelligence' | 'futuristic'

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [analysisData, setAnalysisData] = useState(null)

  useEffect(() => {
    const handleNavigateToForensics = (event: CustomEvent) => {
      setActiveView('forensics')
      if (event.detail?.document) {
        setAnalysisData(event.detail.document.results)
      }
    }

    window.addEventListener('navigate-to-forensics', handleNavigateToForensics as EventListener)
    return () => {
      window.removeEventListener('navigate-to-forensics', handleNavigateToForensics as EventListener)
    }
  }, [])

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'Overview and analytics'
    },
    {
      id: 'upload',
      name: 'Document Upload',
      icon: DocumentTextIcon,
      description: 'Upload and verify documents'
    },
    {
      id: 'forensics',
      name: 'Forensic Analysis',
      icon: EyeIcon,
      description: 'Deep document analysis'
    },
    {
      id: 'risk-intelligence',
      name: 'Risk Intelligence',
      icon: ShieldCheckIcon,
      description: 'Background and risk checks'
    },
    {
      id: 'futuristic',
      name: 'Futuristic Features',
      icon: CpuChipIcon,
      description: 'AR, Blockchain & AI Assistant'
    }
  ]

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <section className="mb-6">
              <div className="glass-card neon-border p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="max-w-2xl">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                      The Trust & Verification Platform for a Zero‑Trust World
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-gray-300">
                      Forensic document analysis, AI anomaly detection, blockchain anchoring, dark web intelligence, and advanced identity validation — flawlessly integrated and built to scale globally.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href="/monitoring" className="btn-cyber">Launch Monitoring</a>
                      <a href="/blockchain" className="px-5 py-2.5 rounded-lg font-medium border border-white/10 text-white hover:bg-white/10 transition-colors">Anchor on Blockchain</a>
                      <a href="/ai-assistant" className="px-5 py-2.5 rounded-lg font-medium border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors">Ask AI Assistant</a>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="glass-card p-4">
                      <p className="text-xs text-gray-400">Authenticity Rate</p>
                      <p className="mt-1 text-2xl font-bold text-green-400">94.2%</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-xs text-gray-400">High‑Risk Flags</p>
                      <p className="mt-1 text-2xl font-bold text-red-400">3</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-xs text-gray-400">Documents Today</p>
                      <p className="mt-1 text-2xl font-bold text-white">24</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-xs text-gray-400">AI Engine Status</p>
                      <p className="mt-1 text-2xl font-bold text-blue-300">Operational</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <Dashboard analysisData={analysisData} />
          </>
        )
      case 'upload':
        return <DocumentUpload onAnalysisComplete={setAnalysisData} />
      case 'forensics':
        return <ForensicAnalysis data={analysisData} />
      case 'risk-intelligence':
        return <RiskIntelligence data={analysisData} />
      case 'futuristic':
        return <FuturisticFeatures activeDocument={analysisData} />
      default:
        return <Dashboard analysisData={analysisData} />
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Navigation */}
        <div className="lg:hidden glass-card">
          <div className="mobile-container py-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))'
              }}>
                <CpuChipIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AuthCorp</h1>
                <p className="text-xs text-gray-300">AI Verification</p>
              </div>
            </div>
            <div className="flex space-x-1 overflow-x-auto pb-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as ActiveView)}
                    className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeView === item.id
                        ? 'text-white neon-border'
                        : 'text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:block">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0 glass-card">
          <div className="p-6 sticky top-0">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))'
              }}>
                <CpuChipIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AuthCorp</h1>
                <p className="text-sm text-gray-300">AI Verification</p>
              </div>
            </div>
            <Navigation
              items={navigationItems}
              activeView={activeView}
              onViewChange={(view) => setActiveView(view as ActiveView)}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 mobile-container py-4 lg:p-6 overflow-auto">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveView()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}