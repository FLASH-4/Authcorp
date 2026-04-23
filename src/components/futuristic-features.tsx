'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CubeTransparentIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  BeakerIcon,
  EyeIcon,
  CameraIcon,
  MicrophoneIcon,
  PlayIcon,
  StopIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useForensics } from '@/components/forensics-provider'
import { dataService, type RealTimeStats, type RecentActivity, type SystemHealth } from '@/lib/data-service'
import { buildAssistantContextSummary, buildAssistantSuggestions, buildAssistantWelcome, generateAssistantResponse, type AssistantContextSnapshot } from '@/lib/assistant-engine'

type BlockchainNetworkConfig = {
  id: string
  label: string
  chainId: number
  rpcEnvKey: string
  explorerLabel: string
  explorerUrl: string
  description: string
  tone: 'blue' | 'emerald'
  symbol: string
  configured: boolean
}

type BlockchainConfigResponse = {
  networks: BlockchainNetworkConfig[]
  configuredCount: number
  totalCount: number
  defaultNetworkId: string | null
  canAnchor: boolean
  message: string
}

type BlockchainAnchorRecord = {
  anchorId: string
  network: string
  networkLabel?: string
  chainId?: number
  anchoredAt: string
  hashPreview: string
  documentId: string
  documentLabel: string
  status: string
}

type AssistantRuntimeStatus = {
  mode: 'openai' | 'model-endpoint' | 'local-contextual'
  ready: boolean
  providerLabel: string
  configuredKeys: string[]
  missingKeys: string[]
  message: string
}

interface FuturisticFeaturesProps {
  activeDocument?: any
}

type FeatureMode = 'ar' | 'blockchain' | 'ai-assistant' | 'simulation' | 'monitoring'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  topic?: string
  confidence?: number
  followUps?: string[]
  summary?: string
}

const BLOCKCHAIN_HISTORY_KEY = 'authcorp_futuristic_anchor_history'

const readBlockchainHistory = (): BlockchainAnchorRecord[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(BLOCKCHAIN_HISTORY_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to load blockchain history:', error)
    return []
  }
}

const persistBlockchainHistory = (history: BlockchainAnchorRecord[]) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(BLOCKCHAIN_HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to persist blockchain history:', error)
  }
}

const suggestionToneStyles: Record<'blue' | 'emerald' | 'amber' | 'violet', string> = {
  blue: 'from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-black',
  emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-black',
  amber: 'from-amber-500/20 to-orange-500/20 border-amber-400/30 text-black',
  violet: 'from-violet-500/20 to-fuchsia-500/20 border-violet-400/30 text-black',
}

export function FuturisticFeatures({ activeDocument }: FuturisticFeaturesProps) {
  const { state } = useForensics()
  const [activeFeature, setActiveFeature] = useState<FeatureMode>('ar')
  const [isARActive, setIsARActive] = useState(false)
  const [liveStats, setLiveStats] = useState<RealTimeStats | null>(null)
  const [liveHealth, setLiveHealth] = useState<SystemHealth | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [blockchainConfig, setBlockchainConfig] = useState<BlockchainConfigResponse | null>(null)
  const [selectedNetworkId, setSelectedNetworkId] = useState('')
  const [blockchainHistory, setBlockchainHistory] = useState<BlockchainAnchorRecord[]>([])
  const [anchorLoading, setAnchorLoading] = useState(false)
  const [anchorMessage, setAnchorMessage] = useState('')
  const [assistantStatus, setAssistantStatus] = useState<AssistantRuntimeStatus>({
    mode: 'local-contextual',
    ready: false,
    providerLabel: 'Local contextual mode',
    configuredKeys: [],
    missingKeys: ['OPENAI_API_KEY or AI_MODEL_ENDPOINT'],
    message: 'Loading assistant configuration...'
  })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const features = [
    { id: 'ar', name: 'AR Forensics', icon: CubeTransparentIcon, description: 'Augmented reality document analysis' },
    { id: 'blockchain', name: 'Blockchain Anchoring', icon: LinkIcon, description: 'Immutable verification records' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: ChatBubbleLeftRightIcon, description: 'Intelligent forensics guidance' },
    { id: 'simulation', name: 'Threat Simulation', icon: BeakerIcon, description: 'Fraud scenario testing' },
    { id: 'monitoring', name: 'Continuous Monitoring', icon: EyeIcon, description: 'Real-time threat detection' },
  ]

  const getDocumentLabel = (document: any) => {
    if (!document) {
      return 'Current document'
    }

    if (typeof document.filename === 'string' && document.filename.trim()) {
      return document.filename.trim()
    }

    if (typeof document.documentId === 'string' && document.documentId.trim()) {
      return document.documentId.trim()
    }

    if (typeof document.name === 'string' && document.name.trim()) {
      return document.name.trim()
    }

    const documentType = document.classification?.type || document.fileType || document.type
    if (typeof documentType === 'string' && documentType.trim()) {
      return documentType.replace(/[_-]+/g, ' ')
    }

    if (typeof document.id === 'string' && document.id.trim()) {
      return document.id.trim()
    }

    return 'Current document'
  }

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) {
      return 'Not available'
    }

    return new Date(value).toLocaleString()
  }

  const toPercent = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0
    }

    return value <= 1 ? value * 100 : value
  }

  const currentDocument = useMemo(() => {
    if (activeDocument) {
      return activeDocument
    }

    if (state.activeDocument) {
      return state.activeDocument
    }

    const completedDocuments = state.documents.filter((document) => document.status === 'completed')
    return completedDocuments[completedDocuments.length - 1] ?? state.documents[state.documents.length - 1] ?? null
  }, [activeDocument, state.activeDocument, state.documents])

  const analysisResults = useMemo(() => {
    if (!currentDocument) {
      return null
    }

    if (currentDocument.results) {
      return currentDocument.results
    }

    if (currentDocument.analysisResults) {
      return currentDocument.analysisResults
    }

    if (currentDocument.authenticity || currentDocument.forensics || currentDocument.riskIntelligence || currentDocument.heatmap) {
      return currentDocument
    }

    return null
  }, [currentDocument])

  const documentLabel = getDocumentLabel(currentDocument)
  const assistantContext = useMemo<AssistantContextSnapshot>(() => ({
    document: currentDocument,
    stats: liveStats,
    health: liveHealth,
    recentActivity: recentActivity.slice(0, 5).map((activity) => ({
      type: activity.type,
      document: activity.document,
      result: activity.result,
      time: activity.time,
    })),
  }), [currentDocument, liveHealth, liveStats, recentActivity])
  const assistantContextSummary = useMemo(() => buildAssistantContextSummary(assistantContext), [assistantContext])
  const assistantWelcome = useMemo(() => buildAssistantWelcome(assistantContext), [assistantContext])
  const assistantSuggestions = useMemo(() => buildAssistantSuggestions(assistantContext), [assistantContext])
  const selectedBlockchainNetwork = useMemo(() => {
    if (!blockchainConfig?.networks?.length) {
      return null
    }

    return (
      blockchainConfig.networks.find((network) => network.id === selectedNetworkId) ??
      blockchainConfig.networks.find((network) => network.configured) ??
      blockchainConfig.networks[0] ??
      null
    )
  }, [blockchainConfig, selectedNetworkId])

  const blockchainHistorySorted = useMemo(() => [...blockchainHistory].sort((left, right) => {
    const leftTime = new Date(left.anchoredAt).getTime()
    const rightTime = new Date(right.anchoredAt).getTime()
    return rightTime - leftTime
  }), [blockchainHistory])

  const arOverlays = useMemo<Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    confidence: number
    description: string
  }>>(() => {
    const heatmapRegions = analysisResults?.heatmap?.suspiciousRegions ?? []

    return heatmapRegions.map((region: any, index: number) => ({
      id: `${region.type || 'region'}-${index}`,
      x: Number(region.x) || 0,
      y: Number(region.y) || 0,
      width: Number(region.width) || 0,
      height: Number(region.height) || 0,
      confidence: toPercent(region.confidence),
      description: `${String(region.type || 'Suspicious region').replace(/[_-]+/g, ' ')} • ${Math.round(toPercent(region.confidence))}% confidence`,
    }))
  }, [analysisResults])

  const loadLiveData = async () => {
    try {
      const [stats, health, activity] = await Promise.all([
        dataService.getRealTimeStats(),
        dataService.getSystemHealth(),
        dataService.getRecentActivity(5),
      ])

      setLiveStats(stats)
      setLiveHealth(health)
      setRecentActivity(activity.slice(0, 5))
    } catch (error) {
      console.error('Failed to load live feature data:', error)
    }
  }

  const loadBlockchainConfig = async () => {
    try {
      const response = await fetch('/api/blockchain/config')
      if (!response.ok) {
        throw new Error(`Blockchain config request failed with ${response.status}`)
      }

      const config = (await response.json()) as BlockchainConfigResponse
      setBlockchainConfig(config)
      setSelectedNetworkId((current) => {
        if (current && config.networks.some((network) => network.id === current)) {
          return current
        }

        return config.defaultNetworkId ?? config.networks.find((network) => network.configured)?.id ?? config.networks[0]?.id ?? ''
      })
    } catch (error) {
      console.error('Failed to load blockchain config:', error)
      setBlockchainConfig({
        networks: [],
        configuredCount: 0,
        totalCount: 0,
        defaultNetworkId: null,
        canAnchor: false,
        message: 'Blockchain anchoring is unavailable until network environment keys are configured.',
      })
      setSelectedNetworkId('')
    }
  }

  const loadAssistantStatus = async () => {
    try {
      const response = await fetch('/api/assistant/status')
      if (!response.ok) {
        throw new Error(`Assistant status request failed with ${response.status}`)
      }

      setAssistantStatus(await response.json())
    } catch (error) {
      console.error('Failed to load assistant status:', error)
      setAssistantStatus({
        mode: 'local-contextual',
        ready: false,
        providerLabel: 'Local contextual mode',
        configuredKeys: [],
        missingKeys: ['OPENAI_API_KEY or AI_MODEL_ENDPOINT'],
        message: 'No external AI key is set yet. The assistant is running in local contextual mode until you wire one in.',
      })
    }
  }

  const normalizeHistoryRecord = (record: Partial<BlockchainAnchorRecord>): BlockchainAnchorRecord => ({
    anchorId: record.anchorId ?? `anchor_${Date.now()}`,
    network: record.network ?? selectedBlockchainNetwork?.id ?? 'unknown',
    networkLabel: record.networkLabel ?? selectedBlockchainNetwork?.label ?? record.network ?? 'Unknown network',
    chainId: record.chainId,
    anchoredAt: record.anchoredAt ?? new Date().toISOString(),
    hashPreview: record.hashPreview ?? 'pending',
    documentId: record.documentId ?? currentDocument?.id ?? currentDocument?.documentId ?? 'unknown',
    documentLabel: record.documentLabel ?? documentLabel,
    status: record.status ?? 'anchored',
  })

  const buildAssistantWelcomeMessage = (): ChatMessage => ({
    id: 'assistant-welcome',
    type: 'assistant',
    content: assistantWelcome,
    timestamp: new Date(),
    topic: 'overview',
    confidence: 0.95,
    followUps: assistantSuggestions.slice(0, 3).map((suggestion) => suggestion.prompt),
  })

  const buildDocumentAnchorHash = async () => {
    const payload = JSON.stringify({
      documentId: currentDocument?.id ?? currentDocument?.documentId ?? null,
      documentLabel,
      status: currentDocument?.status ?? null,
      authenticity: analysisResults?.authenticity ?? null,
      metadataAnalysis: analysisResults?.forensics?.metadataAnalysis ?? null,
      textAnalysis: analysisResults?.forensics?.textAnalysis ?? null,
      riskIntelligence: analysisResults?.riskIntelligence ?? null,
      liveDocumentsProcessed: liveStats?.documentsProcessed ?? null,
    })

    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
    }

    return Array.from(payload).map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('').slice(0, 128)
  }

  const startARSession = async () => {
    try {
      setCameraError(null)
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      setCameraStream(stream)
      setIsARActive(true)
    } catch (error) {
      const message = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Camera permission is blocked. Click the lock icon beside localhost, set Camera to Allow, reload the page, then click Start camera again.'
        : error instanceof Error
          ? error.message
          : 'Unable to access the camera.'

      setCameraError(message)
      console.error('AR camera access failed:', error)
    }
  }

  const stopARSession = () => {
    const stream = cameraStream ?? (videoRef.current?.srcObject as MediaStream | null)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setCameraStream(null)
    setIsARActive(false)
  }

  const refreshBlockchainAnchoring = async () => {
    await loadBlockchainConfig()
    setAnchorMessage('Blockchain readiness refreshed from the live config route.')
  }

  const refreshAssistantStatus = async () => {
    await loadAssistantStatus()
  }

  const anchorCurrentDocument = async () => {
    if (!selectedBlockchainNetwork?.configured || !blockchainConfig?.canAnchor) {
      setAnchorMessage('Configure a blockchain RPC URL before anchoring the current document.')
      return
    }

    if (!currentDocument) {
      setAnchorMessage('Select or upload a document before anchoring.')
      return
    }

    try {
      setAnchorLoading(true)
      setAnchorMessage('')

      const hash = await buildDocumentAnchorHash()
      const response = await fetch('/api/blockchain/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, network: selectedBlockchainNetwork.id }),
      })

      const responseData = await response.json()
      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to anchor the document')
      }

      const newRecord = normalizeHistoryRecord({
        anchorId: responseData.anchorId,
        network: responseData.network,
        networkLabel: responseData.networkLabel,
        chainId: responseData.chainId,
        anchoredAt: responseData.anchoredAt,
        hashPreview: responseData.hashPreview,
        documentId: currentDocument?.id ?? currentDocument?.documentId ?? 'unknown',
        documentLabel,
        status: responseData.status ?? 'anchored',
      })

      setBlockchainHistory((history) => [newRecord, ...history].slice(0, 12))
      setAnchorMessage(`Anchored ${documentLabel} on ${newRecord.networkLabel || newRecord.network}.`)
    } catch (error) {
      console.error('Failed to anchor current document:', error)
      setAnchorMessage(error instanceof Error ? error.message : 'Anchoring failed.')
    } finally {
      setAnchorLoading(false)
    }
  }

  const sendMessage = async (promptOverride?: string) => {
    const messageText = (promptOverride ?? inputMessage).trim()
    if (!messageText || isTyping) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setChatMessages((previousMessages) => [...previousMessages, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 350))
      const response = generateAssistantResponse(messageText, assistantContext)
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        topic: response.topic,
        confidence: response.confidence,
        followUps: response.followUps,
        summary: response.summary,
      }

      setChatMessages((previousMessages) => [...previousMessages, assistantMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const resetConversation = () => {
    setChatMessages([])
    setInputMessage('')
  }

  useEffect(() => {
    void loadLiveData()
    const unsubscribeStats = dataService.subscribe('stats_updated', (stats: RealTimeStats) => setLiveStats(stats))
    const unsubscribeActivity = dataService.subscribe('activity_updated', (activity: RecentActivity[]) => {
      setRecentActivity(Array.isArray(activity) ? activity.slice(0, 5) : [])
    })
    const unsubscribeHealth = dataService.subscribe('health_updated', (health: SystemHealth) => setLiveHealth(health))

    return () => {
      unsubscribeStats()
      unsubscribeActivity()
      unsubscribeHealth()
    }
  }, [])

  useEffect(() => {
    void loadBlockchainConfig()
  }, [])

  useEffect(() => {
    void loadAssistantStatus()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedHistory = readBlockchainHistory().map((record) => normalizeHistoryRecord(record))
      setBlockchainHistory(storedHistory)
    } catch (error) {
      console.error('Failed to read blockchain history:', error)
    }
  }, [])

  useEffect(() => {
    persistBlockchainHistory(blockchainHistory)
  }, [blockchainHistory])

  useEffect(() => {
    if (chatMessages.length > 0) {
      return
    }

    setChatMessages([buildAssistantWelcomeMessage()])
  }, [assistantWelcome, assistantSuggestions, chatMessages.length])

  useEffect(() => {
    if (activeFeature !== 'ar' && isARActive) {
      stopARSession()
    }
  }, [activeFeature, isARActive])

  useEffect(() => {
    return () => {
      stopARSession()
    }
  }, [])

  useEffect(() => {
    if (!isARActive || !cameraStream || !videoRef.current) {
      return
    }

    const video = videoRef.current
    video.srcObject = cameraStream

    void video.play().catch((error) => {
      console.error('AR camera playback failed:', error)
    })

    return () => {
      video.pause()
      video.srcObject = null
    }
  }, [cameraStream, isARActive])

  const ARForensics = () => {
    const authenticity = analysisResults?.authenticity
    const metadataAnalysis = analysisResults?.forensics?.metadataAnalysis
    const textAnalysis = analysisResults?.forensics?.textAnalysis
    const riskIntelligence = analysisResults?.riskIntelligence
    const suspiciousCount = arOverlays.length
    const liveDocumentCount = liveStats?.documentsProcessed ?? 0
    const activeRiskFlags = liveStats?.highRiskFlags ?? 0
    const confidenceValue = authenticity?.confidence ?? (suspiciousCount > 0 ? arOverlays[0].confidence : 0)
    const documentStateLabel = currentDocument?.status ?? (analysisResults ? 'completed' : 'pending')

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AR Document Analysis
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {documentLabel} • {documentStateLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={loadLiveData}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh live data
            </button>
          </div>

          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            {isARActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {arOverlays.map((overlay) => (
                  <motion.div
                    key={overlay.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute border-2 border-red-500 bg-red-500/20 rounded-md backdrop-blur-[1px]"
                    style={{
                      left: `${overlay.x}px`,
                      top: `${overlay.y}px`,
                      width: `${overlay.width}px`,
                      height: `${overlay.height}px`,
                    }}
                  >
                    <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {Math.round(overlay.confidence)}%
                    </div>
                    <div className="absolute -bottom-6 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded max-w-56">
                      {overlay.description}
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="w-full min-h-64 flex items-center justify-center px-6 py-10">
                <div className="max-w-md text-center">
                  <DocumentTextIcon className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 dark:text-gray-200 font-medium">
                    {analysisResults ? 'Ready to overlay live evidence on camera.' : 'No analysis result is loaded yet.'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {analysisResults
                      ? `${suspiciousCount} suspicious region${suspiciousCount === 1 ? '' : 's'} derived from the current document.`
                      : 'Upload or complete a document analysis to generate live AR overlays.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              {!isARActive ? (
                <button
                  type="button"
                  onClick={startARSession}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  Start AR Session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopARSession}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopIcon className="w-4 h-4" />
                  Stop AR Session
                </button>
              )}
            </div>

            {cameraError ? (
              <div className="max-w-xl rounded-xl border border-rose-400/30 bg-rose-100 px-3 py-2 text-sm text-black dark:bg-rose-500/10 dark:text-black">
                {cameraError}
              </div>
            ) : null}

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4" />
              {suspiciousCount} regions, {activeRiskFlags} live risk flags, {liveDocumentCount} documents processed
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Authenticity</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {authenticity ? `${authenticity.score.toFixed(1)}%` : 'Pending'}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {authenticity ? `${Math.round(toPercent(authenticity.confidence))}% confidence` : 'Waiting for analysis results'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Suspicious regions</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{suspiciousCount}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {suspiciousCount > 0 ? 'Derived from the document heatmap' : 'No heatmap regions available yet'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Metadata clues</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {metadataAnalysis?.tamperingClues?.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {metadataAnalysis?.editingSoftware ? `Edited with ${metadataAnalysis.editingSoftware}` : 'No editor metadata detected yet'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Risk signal</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {riskIntelligence ? `${Math.round(riskIntelligence.personRiskScore)}/100` : 'Pending'}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {riskIntelligence ? `${riskIntelligence.riskCategory} risk • ${riskIntelligence.findings.length} findings` : 'Risk intelligence not available yet'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-500" />
              Authenticity reasoning
            </h4>
            {authenticity?.reasoning?.length ? (
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {authenticity.reasoning.map((reason: string, index: number) => (
                  <li key={`${reason}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Authenticity reasoning will appear once the selected document completes analysis.
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-blue-500" />
              Text analysis
            </h4>
            {textAnalysis ? (
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  Font consistency: <span className="font-semibold text-gray-900 dark:text-white">{textAnalysis.fontConsistency.toFixed(1)}%</span>
                </p>
                <p>
                  Signature verification: <span className="font-semibold text-gray-900 dark:text-white">{textAnalysis.signatureVerification ? (textAnalysis.signatureVerification.isValid ? 'Valid' : 'Flagged') : 'Unavailable'}</span>
                </p>
                <p>
                  Alignment issues: <span className="font-semibold text-gray-900 dark:text-white">{textAnalysis.alignmentIssues?.length ?? 0}</span>
                </p>
                {textAnalysis.alignmentIssues?.length ? (
                  <div className="space-y-2">
                    {textAnalysis.alignmentIssues.slice(0, 3).map((issue: string, index: number) => (
                      <div key={`${issue}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                        {issue}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Text analysis is waiting on the active document.
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-emerald-500" />
              Recent activity
            </h4>
            {recentActivity.length ? (
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {recentActivity.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.document}</p>
                    <p className="mt-1">{activity.result} • {Math.round(activity.confidence)}% confidence</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recent activity will populate automatically from live telemetry.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const BlockchainAnchoring = () => {
    const configuredCount = blockchainConfig?.configuredCount ?? 0
    const totalCount = blockchainConfig?.totalCount ?? 0
    const canAnchor = Boolean(blockchainConfig?.canAnchor && selectedBlockchainNetwork?.configured)

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Blockchain Document Registry
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {blockchainConfig?.message || 'Loading blockchain configuration...'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={refreshBlockchainAnchoring}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh config
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(blockchainConfig?.networks ?? []).map((network) => {
              const selected = network.id === selectedBlockchainNetwork?.id
              const badgeClass = network.configured
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'

              return (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => setSelectedNetworkId(network.id)}
                  className={`text-left rounded-xl border p-4 transition-all ${selected ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{network.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chain ID {network.chainId} • {network.symbol}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                      {network.configured ? 'Configured' : 'Needs key'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                    {network.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{network.rpcEnvKey}</span>
                    <span>{network.explorerLabel}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Selected network</p>
              <p className="mt-2 font-semibold text-gray-900 dark:text-white">{selectedBlockchainNetwork?.label || 'None selected'}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {selectedBlockchainNetwork ? `${selectedBlockchainNetwork.chainId} • ${selectedBlockchainNetwork.explorerLabel}` : 'Pick a configured network to anchor a document.'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Configuration status</p>
              <p className="mt-2 font-semibold text-gray-900 dark:text-white">{configuredCount}/{totalCount} networks ready</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {blockchainConfig?.canAnchor ? 'Anchoring is available now.' : 'Add RPC keys to enable anchoring.'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Latest receipt</p>
              <p className="mt-2 font-semibold text-gray-900 dark:text-white">{blockchainHistorySorted[0]?.documentLabel || 'No anchors yet'}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {blockchainHistorySorted[0] ? `${blockchainHistorySorted[0].networkLabel || blockchainHistorySorted[0].network} • ${formatDateTime(blockchainHistorySorted[0].anchoredAt)}` : 'Anchor a document to populate the receipt stream.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              {canAnchor ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
              )}
              {currentDocument ? `Ready to anchor ${documentLabel}` : 'Select a document to anchor'}
            </div>

            <button
              type="button"
              onClick={() => void anchorCurrentDocument()}
              disabled={!canAnchor || anchorLoading || !currentDocument}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {anchorLoading ? 'Anchoring...' : 'Anchor current document'}
            </button>
          </div>

          {(anchorMessage || !canAnchor) && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${canAnchor && anchorMessage ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300'}`}>
              {anchorMessage || blockchainConfig?.message || 'Blockchain anchoring is waiting on config.'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Recent anchors
            </h4>

            {blockchainHistorySorted.length ? (
              <div className="space-y-3">
                {blockchainHistorySorted.slice(0, 6).map((record) => (
                  <div key={record.anchorId} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{record.documentLabel}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {record.networkLabel || record.network} • Chain {record.chainId ?? 'n/a'}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {record.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Hash preview</p>
                        <p className="mt-1 font-mono break-all text-gray-900 dark:text-white">{record.hashPreview}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Anchored at</p>
                        <p className="mt-1 text-gray-900 dark:text-white">{formatDateTime(record.anchoredAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No blockchain receipts have been created yet.
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
              Anchoring readiness
            </h4>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>
                {blockchainConfig?.canAnchor
                  ? 'The selected network is configured and ready to accept document hashes.'
                  : 'The UI is waiting for environment-driven RPC configuration.'}
              </p>
              <p>
                Anchored records are stored locally in your browser so the stream stays visible after refresh.
              </p>
              <p>
                Explorer target: <span className="font-semibold text-gray-900 dark:text-white">{selectedBlockchainNetwork?.explorerLabel || 'Unavailable'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const AIAssistant = () => {
    const latestMessage = chatMessages[chatMessages.length - 1]

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Forensics Assistant
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assistantStatus.providerLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshAssistantStatus}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh status
              </button>
              <button
                type="button"
                onClick={resetConversation}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Reset chat
              </button>
            </div>
          </div>

          <div className={`rounded-xl border px-4 py-3 text-sm ${assistantStatus.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-200' : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300'}`}>
            <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
              <span className="font-medium">{assistantStatus.message}</span>
              <span className="text-xs uppercase tracking-wide opacity-80">Mode: {assistantStatus.mode}</span>
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {assistantStatus.configuredKeys.length ? `Configured: ${assistantStatus.configuredKeys.join(', ')}` : `Missing: ${assistantStatus.missingKeys.join(', ')}`}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Live context</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{assistantContextSummary}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {recentActivity.length ? `${recentActivity.length} recent activity item${recentActivity.length === 1 ? '' : 's'} connected` : 'No live activity yet'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {assistantSuggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => void sendMessage(suggestion.prompt)}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors bg-gradient-to-r ${suggestionToneStyles[suggestion.tone]}`}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-[32rem] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Conversation</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ask about the current document, telemetry, or analysis workflow.</p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {latestMessage?.topic ? `Latest topic: ${latestMessage.topic}` : 'Waiting for your first question'}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-xl rounded-2xl px-4 py-3 shadow-sm ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                  <p className="text-sm leading-6 whitespace-pre-wrap">{message.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-80">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.topic ? <span className="rounded-full border border-current/20 px-2 py-0.5">{message.topic}</span> : null}
                    {typeof message.confidence === 'number' ? <span className="rounded-full border border-current/20 px-2 py-0.5">{Math.round(message.confidence * 100)}% confidence</span> : null}
                  </div>
                  {message.summary ? <p className="mt-2 text-xs opacity-80">{message.summary}</p> : null}
                  {message.followUps?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.followUps.slice(0, 3).map((followUp) => (
                        <button
                          key={followUp}
                          type="button"
                          onClick={() => void sendMessage(followUp)}
                          className="rounded-full bg-white/15 px-3 py-1 text-xs hover:bg-white/25 transition-colors"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder={`Ask about ${documentLabel.toLowerCase()}...`}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isTyping ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
              Current context
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {assistantContextSummary}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <BeakerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Suggested next step
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {assistantSuggestions[0]?.prompt || 'Ask for a summary of the current document.'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <SparklesIcon className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
              Provider readiness
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              {assistantStatus.ready ? 'External AI is ready to wire in later.' : 'Local contextual mode stays active until a provider key is added.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderFeature = () => {
    switch (activeFeature) {
      case 'ar':
        return <ARForensics />
      case 'blockchain':
        return <BlockchainAnchoring />
      case 'ai-assistant':
        return <AIAssistant />
      case 'simulation':
        return <div className="text-center py-12 text-gray-500">Threat Simulation - Coming Soon</div>
      case 'monitoring':
        return <div className="text-center py-12 text-gray-500">Continuous Monitoring - Coming Soon</div>
      default:
        return <ARForensics />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white dark:text-white">
          Futuristic Features
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Next-generation forensic technologies and AI-powered capabilities
        </p>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
        {features.map((feature) => {
          const Icon = feature.icon

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => setActiveFeature(feature.id as FeatureMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeFeature === feature.id ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{feature.name}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderFeature()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}