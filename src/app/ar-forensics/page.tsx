'use client'

import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  CameraIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ForensicAnalysis } from '@/components/forensic-analysis'
import { useForensics } from '@/components/forensics-provider'
import { type DocumentClassification } from '@/lib/document-classifier'
import toast from 'react-hot-toast'

type AnalysisDocument = {
  id: string
  filename: string
  fileType: string
  fileSize: number
  status: 'uploading' | 'analyzing' | 'completed' | 'failed' | 'blocked'
  progress: number
  blockedReason?: string
  classification?: DocumentClassification
  results?: any
  uploadedAt: Date
}

type OverlayTone = 'blue' | 'amber' | 'red'

type OverlayRegion = {
  id: string
  label: string
  left: number
  top: number
  width: number
  height: number
  confidence: number
  tone: OverlayTone
}

const DOCUMENT_WIDTH = 400
const DOCUMENT_HEIGHT = 560

const overlayToneStyles: Record<OverlayTone, string> = {
  blue: 'border-cyan-300/70 bg-cyan-400/15 text-cyan-50',
  amber: 'border-amber-300/70 bg-amber-400/15 text-amber-50',
  red: 'border-rose-300/70 bg-rose-500/15 text-rose-50',
}

const statusStyles: Record<string, string> = {
  uploading: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  analyzing: 'border-violet-400/40 bg-violet-500/15 text-violet-100',
  completed: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  blocked: 'border-rose-400/40 bg-rose-500/15 text-rose-100',
  failed: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeConfidence = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return value <= 1 ? value * 100 : value
}

const formatFileSize = (value?: number) => {
  if (!value) {
    return 'Unknown size'
  }

  if (value < 1024) {
    return `${value} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = value / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

const getDocumentLabel = (document: AnalysisDocument | null) => {
  if (!document) {
    return 'No document selected'
  }

  if (document.filename.trim()) {
    return document.filename.trim()
  }

  return document.id
}

const buildOverlayRegions = (results: any): OverlayRegion[] => {
  if (!results) {
    return []
  }

  const heatmapRegions = results.heatmap?.suspiciousRegions
  if (Array.isArray(heatmapRegions) && heatmapRegions.length > 0) {
    return heatmapRegions.map((region: any, index: number) => ({
      id: `${region.type || 'region'}-${index}`,
      label: String(region.type || 'Suspicious region').replace(/[_-]+/g, ' '),
      left: clamp((Number(region.x) / DOCUMENT_WIDTH) * 100, 4, 92),
      top: clamp((Number(region.y) / DOCUMENT_HEIGHT) * 100, 8, 86),
      width: clamp((Number(region.width) / DOCUMENT_WIDTH) * 100, 8, 64),
      height: clamp((Number(region.height) / DOCUMENT_HEIGHT) * 100, 5, 34),
      confidence: normalizeConfidence(region.confidence),
      tone: region.confidence > 0.85 ? 'red' : region.confidence > 0.65 ? 'amber' : 'blue',
    }))
  }

  const overlays: OverlayRegion[] = []
  const metadataAnalysis = results.forensics?.metadataAnalysis
  const textAnalysis = results.forensics?.textAnalysis
  const riskIntelligence = results.riskIntelligence

  metadataAnalysis?.tamperingClues?.slice(0, 3).forEach((clue: string, index: number) => {
    overlays.push({
      id: `metadata-${index}`,
      label: clue,
      left: 8,
      top: clamp(14 + index * 12, 8, 72),
      width: 44,
      height: 9,
      confidence: clamp(74 + index * 4, 0, 100),
      tone: 'amber',
    })
  })

  textAnalysis?.alignmentIssues?.slice(0, 3).forEach((issue: string, index: number) => {
    overlays.push({
      id: `text-${index}`,
      label: issue,
      left: 28,
      top: clamp(42 + index * 10, 12, 76),
      width: 40,
      height: 8,
      confidence: clamp(70 + index * 5, 0, 100),
      tone: 'blue',
    })
  })

  riskIntelligence?.findings?.slice(0, 2).forEach((finding: any, index: number) => {
    overlays.push({
      id: `risk-${index}`,
      label: finding.description || 'Risk finding',
      left: 56,
      top: clamp(20 + index * 14, 12, 78),
      width: 32,
      height: 10,
      confidence: clamp(finding.confidence ?? 80, 0, 100),
      tone: 'red',
    })
  })

  if (results.authenticity?.category && results.authenticity.category !== 'authentic') {
    overlays.push({
      id: 'authenticity-flag',
      label: `${results.authenticity.category.replace(/[_-]+/g, ' ')} flag`,
      left: 22,
      top: 66,
      width: 52,
      height: 12,
      confidence: normalizeConfidence(results.authenticity.confidence),
      tone: results.authenticity.category === 'ai-generated' ? 'red' : 'amber',
    })
  }

  if (!overlays.length) {
    overlays.push({
      id: 'scan-complete',
      label: 'Scan complete',
      left: 30,
      top: 38,
      width: 40,
      height: 12,
      confidence: normalizeConfidence(results.authenticity?.confidence),
      tone: 'blue',
    })
  }

  return overlays.slice(0, 6)
}

export default function ARForensicsPage() {
  const { state, uploadDocument, analyzeDocument, setActiveDocument } = useForensics()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const documents = state.documents as AnalysisDocument[]

  const selectedDocument = useMemo<AnalysisDocument | null>(() => {
    if (selectedDocumentId) {
      return documents.find((document) => document.id === selectedDocumentId) ?? null
    }

    if (state.activeDocument) {
      return state.activeDocument as AnalysisDocument
    }

    const latestDocument = [...documents].reverse().find((document) => document.results || document.status === 'completed' || document.status === 'blocked')
    return latestDocument ?? documents[documents.length - 1] ?? null
  }, [documents, selectedDocumentId, state.activeDocument])

  const analysisResults = selectedDocument?.results ?? null
  const overlayRegions = useMemo(() => buildOverlayRegions(analysisResults), [analysisResults])
  const authenticityScore = analysisResults?.authenticity?.score ?? 0
  const confidenceScore = normalizeConfidence(analysisResults?.authenticity?.confidence)
  const isAnalyzing = Boolean(state.isAnalyzing || isUploading || selectedDocument?.status === 'uploading' || selectedDocument?.status === 'analyzing')

  useEffect(() => {
    if (selectedDocumentId || !documents.length) {
      return
    }

    const latestDocument = [...documents].reverse().find((document) => document.results || document.status === 'completed' || document.status === 'blocked')
    if (latestDocument) {
      setSelectedDocumentId(latestDocument.id)
    }
  }, [documents, selectedDocumentId])

  useEffect(() => {
    if (!selectedDocument) {
      return
    }

    if (state.activeDocument?.id !== selectedDocument.id) {
      setActiveDocument(selectedDocument)
    }
  }, [selectedDocument, setActiveDocument, state.activeDocument])

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!cameraActive || !cameraStream || !videoRef.current) {
      return
    }

    const video = videoRef.current
    video.srcObject = cameraStream

    void video.play().catch((error) => {
      console.error('AR camera playback failed:', error)
    })

  }, [cameraActive, cameraStream])

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploading(true)
    try {
      const documentId = await uploadDocument(file)
      setSelectedDocumentId(documentId)

      await new Promise((resolve) => setTimeout(resolve, 100))
      await analyzeDocument(documentId)

      toast.success(`${file.name} loaded into AR analysis`)
    } catch (error) {
      console.error('AR upload failed:', error)
      toast.error('Unable to analyze the selected file')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId)
    const document = documents.find((item) => item.id === documentId) ?? null
    setActiveDocument(document)
  }

  const startCamera = async () => {
    try {
      setCameraError(null)
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16/9 },
        },
        audio: false,
      })

      setCameraStream(stream)
      setCameraActive(true)
    } catch (error) {
      const message = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Camera permission is blocked. Click the lock icon beside localhost, set Camera to Allow, reload the page, then click Start camera again.'
        : error instanceof Error
          ? error.message
          : 'Unable to access the camera.'

      setCameraError(message)
      toast.error('Camera access failed')
    }
  }

  const stopCamera = () => {
    const stream = cameraStream ?? (videoRef.current?.srcObject as MediaStream | null)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setCameraStream(null)
    setCameraActive(false)
  }

  const refreshScan = async () => {
    if (!selectedDocument) {
      toast.error('Upload or select a document first')
      return
    }

    try {
      await analyzeDocument(selectedDocument.id)
      toast.success('AR scan refreshed')
    } catch (error) {
      console.error('Unable to refresh AR scan:', error)
      toast.error('Unable to refresh the scan')
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/95 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/80">
              AR Forensics
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Live document overlays from real analysis results
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Upload a document, let the built-in forensics pipeline analyze it, and project suspicious regions, metadata clues, and risk signals directly over the live camera preview or the static document canvas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-400/25"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              Upload document
            </button>
            {!cameraActive ? (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                <CameraIcon className="h-4 w-4" />
                Start camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-50 transition-colors hover:bg-rose-500/25"
              >
                <CameraIcon className="h-4 w-4" />
                Stop camera
              </button>
            )}
            <button
              type="button"
              onClick={() => void refreshScan()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh scan
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.tif,.tiff,.pdf"
              className="hidden"
              onChange={handleFileSelection}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Selected document</p>
            <p className="mt-2 truncate text-sm font-semibold text-white">{getDocumentLabel(selectedDocument)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {selectedDocument?.fileType || 'Awaiting upload'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Authenticity</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {analysisResults ? `${authenticityScore.toFixed(1)}%` : 'Pending'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {analysisResults ? `${Math.round(confidenceScore)}% confidence` : 'Run an analysis to populate the overlay'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Overlay regions</p>
            <p className="mt-2 text-2xl font-semibold text-white">{overlayRegions.length}</p>
            <p className="mt-1 text-xs text-slate-400">
              Derived from heatmap, metadata, text, and risk signals
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-semibold text-white">{selectedDocument?.status || 'Idle'}</p>
            <p className="mt-1 text-xs text-slate-400">
              {selectedDocument?.blockedReason || (isAnalyzing ? 'Scanning in progress' : 'Ready for analysis')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <DocumentTextIcon className="h-5 w-5 text-cyan-500" />
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Select a document to project its analysis into the AR viewport.
            </p>
          </div>

          <div className="space-y-3">
            {documents.length > 0 ? (
              documents.map((document) => {
                const isSelected = document.id === selectedDocument?.id
                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => handleDocumentSelect(document.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${isSelected ? 'border-cyan-500 bg-cyan-500/5 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {document.filename}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {document.fileType || 'Unknown type'} • {formatFileSize(document.fileSize)}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[document.status] || statusStyles.analyzing}`}>
                        {document.status}
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        initial={false}
                        animate={{ width: `${clamp(document.progress || 0, 0, 100)}%` }}
                        transition={{ duration: 0.25 }}
                      />
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                No documents uploaded yet. Use the upload button to start an AR scan.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <SparklesIcon className="h-4 w-4 text-violet-500" />
              <span className="font-medium">Camera notes</span>
            </div>
            <p className="mt-2">
              {cameraActive
                ? 'The live camera feed is active. The overlay boxes track the selected document’s analysis.'
                : 'Camera is paused. Upload a document or start the camera to review the AR overlay.'}
            </p>
            {cameraError ? (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-black dark:border-amber-800 dark:bg-amber-900/20 dark:text-black">
                {cameraError}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  AR viewport
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {cameraActive ? 'Live camera with projected analysis overlays' : 'Static document preview with projected analysis overlays'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {isAnalyzing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Scanning
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4" />
                    Ready
                  </>
                )}
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[inset_0_0_80px_rgba(8,145,178,0.2)] dark:border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.14),transparent_45%)]" />
              <div className="absolute inset-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/90">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-cyan-100/80">
                  <span>{cameraActive ? 'Camera feed' : 'Document scan surface'}</span>
                  <span>{selectedDocument ? selectedDocument.filename : 'Awaiting document'}</span>
                </div>

                <div className="relative h-full">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 h-full w-full object-contain opacity-90"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))]">
                      <div className="absolute inset-0 px-6 py-8">
                        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                              <ShieldCheckIcon className="h-5 w-5" />
                              Analysis surface ready
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-slate-300">
                              {selectedDocument
                                ? 'The selected document has been mapped into AR coordinates and is ready for live inspection.'
                                : 'Upload a document to generate projected overlay regions and detailed analysis cards.'}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                              <div
                                key={index}
                                className="h-3 rounded-full bg-white/10"
                                style={{ width: `${72 - index * 8}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 via-transparent to-fuchsia-400/10" />

                  <motion.div
                    aria-hidden="true"
                    className="absolute left-0 right-0 h-px bg-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.85)]"
                    animate={{ top: ['12%', '84%', '12%'] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
                  />

                  {overlayRegions.map((region) => (
                    <motion.div
                      key={region.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute rounded-2xl border px-3 py-2 backdrop-blur-sm ${overlayToneStyles[region.tone]}`}
                      style={{
                        left: `${region.left}%`,
                        top: `${region.top}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                      }}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.3em]">
                          <span>Overlay</span>
                          <span>{Math.round(region.confidence)}%</span>
                        </div>
                        <p className="text-xs font-medium leading-4">
                          {region.label}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan-50/80">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {overlayRegions.length} active overlays
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {cameraActive ? 'Live camera' : 'Static analysis mode'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {selectedDocument?.status || 'idle'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Load file
                </button>
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-400/20 dark:text-cyan-100"
                  >
                    <CameraIcon className="h-4 w-4" />
                    Start camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-400/20 dark:text-rose-100"
                  >
                    <CameraIcon className="h-4 w-4" />
                    Stop camera
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void refreshScan()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Re-run scan
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <InformationCircleIcon className="h-4 w-4" />
                {overlayRegions.length > 0
                  ? 'Overlay coordinates are derived from the current document analysis.'
                  : 'No overlay regions yet. Upload a document to generate the AR viewport.'}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Authenticity score</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {analysisResults ? `${authenticityScore.toFixed(1)}%` : 'Pending'}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                  style={{ width: `${clamp(authenticityScore, 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Confidence</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {analysisResults ? `${Math.round(confidenceScore)}%` : 'Pending'}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {analysisResults ? 'Derived from the selected document analysis' : 'Waiting for analysis results'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Suspicious regions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {overlayRegions.length}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Heatmap, metadata, text, and risk overlays combined
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Camera</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {cameraActive ? 'Live' : 'Paused'}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {cameraActive ? 'Overlaying the selected document onto the live feed' : 'Static projection mode enabled'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldCheckIcon className="h-5 w-5 text-cyan-500" />
              <h2 className="text-lg font-semibold">Detailed analysis</h2>
            </div>
            {analysisResults ? (
              <ForensicAnalysis data={analysisResults} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Upload a document to unlock the detailed analysis tabs.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}