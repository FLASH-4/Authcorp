'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { useForensics } from '@/components/forensics-provider'

interface ForensicAnalysisProps {
  data?: any
}

type AnalysisMode = 'overview' | 'heatmap' | 'metadata' | 'text' | 'comparison'

export function ForensicAnalysis({ data }: ForensicAnalysisProps) {
  const { state } = useForensics()
  const [activeMode, setActiveMode] = useState<AnalysisMode>('overview')
  const completedDocs = state.documents.filter(d => d.status === 'completed' || d.status === 'blocked')
  const [selectedDocId, setSelectedDocId] = useState<string>('')
  
  // Auto-select newest completed doc when list changes
  useEffect(() => {
    if (completedDocs.length > 0) {
      const latest = completedDocs[completedDocs.length - 1]
      if (!selectedDocId || !completedDocs.find(d => d.id === selectedDocId)) {
        setSelectedDocId(latest.id)
      }
    }
  }, [completedDocs.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDocument = completedDocs.find(d => d.id === selectedDocId) || completedDocs[completedDocs.length - 1] || null
  const analysisResults = data || selectedDocument?.results

  const completedDocuments = state.documents.filter((doc) => doc.status === 'completed' && doc.results)

  const modes: Array<{ id: AnalysisMode; name: string; icon: typeof EyeIcon }> = [
    { id: 'overview', name: 'Overview', icon: EyeIcon },
    { id: 'heatmap', name: 'Heatmap', icon: ChartBarIcon },
    { id: 'metadata', name: 'Metadata', icon: InformationCircleIcon },
    { id: 'text', name: 'Text Analysis', icon: DocumentTextIcon },
    { id: 'comparison', name: 'Comparison', icon: AdjustmentsHorizontalIcon },
  ]

  useEffect(() => {
    if (!modes.some((mode) => mode.id === activeMode)) {
      setActiveMode('overview')
    }
  }, [activeMode])

  const isModeAvailable = (mode: AnalysisMode) => {
    switch (mode) {
      case 'heatmap':
        return true // always show tab, render empty state inside
      case 'metadata':
        return true
      case 'text':
        return true
      case 'comparison':
        return completedDocuments.length > 1
      default:
        return true
    }
  }

  const getAuthenticityIcon = (category: string) => {
    switch (category) {
      case 'authentic': return CheckCircleIcon
      case 'tampered': return ExclamationTriangleIcon
      case 'forged': return XCircleIcon
      case 'ai-generated': return ExclamationTriangleIcon
      default: return InformationCircleIcon
    }
  }

  const getAuthenticityColor = (category: string) => {
    switch (category) {
      case 'authentic': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'tampered': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'forged': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'ai-generated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const renderOverview = () => {
    const results = analysisResults || selectedDocument?.results
    const documentClassification = selectedDocument?.classification
    const isHighRiskDocument = documentClassification && ['aadhar_card', 'passport', 'driving_license', 'pan_card', 'voter_id'].includes(documentClassification.type)
    const shouldShowThreatAlert = results && (
      (results.authenticity.category === 'ai-generated' && isHighRiskDocument && results.authenticity.confidence > 70) ||
      (results.authenticity.category === 'tampered' && results.authenticity.score < 30)
    )

    if (shouldShowThreatAlert) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6"
        >
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              🚨 SECURITY ALERT: CRITICAL DOCUMENT THREAT 🚨
            </h3>
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4">
              <p className="font-bold">
                {results.authenticity.category === 'ai-generated' ? 
                  `AI-GENERATED ${documentClassification?.type.toUpperCase().replace('_', ' ')} DETECTED` : 
                  'CRITICAL DOCUMENT TAMPERING DETECTED'
                }
              </p>
            </div>
            <p className="text-red-700 dark:text-red-300 mb-4">
              This {documentClassification?.type.replace('_', ' ') || 'document'} has been flagged as {results.authenticity.category.toUpperCase()} with {results.authenticity.confidence.toFixed(1)}% confidence.
              <strong> ACCESS BLOCKED FOR SECURITY.</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-100">Document Type</h4>
                <p className="text-red-700 dark:text-red-300">{documentClassification?.type.toUpperCase().replace('_', ' ') || 'UNKNOWN'}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-100">Threat Level</h4>
                <p className="text-red-700 dark:text-red-300">CRITICAL</p>
              </div>
              <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-100">Action Required</h4>
                <p className="text-red-700 dark:text-red-300">IMMEDIATE REVIEW</p>
              </div>
            </div>
            <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Report Security Incident
            </button>
          </div>
        </motion.div>
      )
    }

    if (documentClassification) {
      return (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <InformationCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Document Classification
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Identified Type</h4>
                <p className="text-blue-700 dark:text-blue-300 text-lg font-semibold">
                  {documentClassification.type.toUpperCase().replace('_', ' ')}
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  Confidence: {(documentClassification.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Verification Status</h4>
                <p className="text-blue-700 dark:text-blue-300">
                  {results?.authenticity.category === 'authentic' ? '✅ Verified Authentic' : 
                   results?.authenticity.category === 'ai-generated' && documentClassification.type === 'presentation' ? 'ℹ️ AI Content (Normal for Presentations)' :
                   '⚠️ Requires Review'}
                </p>
              </div>
            </div>
          </motion.div>
          {renderRegularAnalysis()}
        </div>
      )
    }

    return renderRegularAnalysis()
  }

  const renderRegularAnalysis = () => {
    const results = analysisResults || selectedDocument?.results
    
    if (!results) {
      return (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white dark:text-white mb-2">
            No Analysis Results
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No analysis data available for this document.
          </p>
        </div>
      )
    }

    const AuthenticityIcon = getAuthenticityIcon(results.authenticity.category)

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Document Authenticity Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                results.authenticity.category === 'authentic' ? 'text-green-600' :
                results.authenticity.category === 'ai-generated' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {results.authenticity.score.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Authenticity Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {results.authenticity.confidence.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence Level</p>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold mb-2 capitalize ${
                results.authenticity.category === 'authentic' ? 'text-green-600' :
                results.authenticity.category === 'ai-generated' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {results.authenticity.category.replace('_', ' ')}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Classification</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Reasoning</h4>
            <ul className="space-y-2">
              {results.authenticity.reasoning.map((reason: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderHeatmap = () => {
    const results = analysisResults || selectedDocument?.results
    const heatmap = results?.heatmap
    const regions = heatmap?.suspiciousRegions || []

    if (!heatmap && regions.length === 0) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white dark:text-white mb-2">No Heatmap Data</h3>
          <p className="text-gray-600 dark:text-gray-400">Heatmap analysis is not available for this document.</p>
        </div>
      )
    }

    const colorMap: Record<string, string> = {
      text_modification: 'bg-red-500/60 border-red-400',
      copy_move: 'bg-orange-500/60 border-orange-400',
      compression_anomaly: 'bg-yellow-500/60 border-yellow-400',
      minor_inconsistency: 'bg-blue-500/40 border-blue-400',
    }

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tampering Heatmap</h3>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '420px' }}>
            {/* Background grid */}
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
            {regions.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-green-400 font-semibold text-lg">No Suspicious Regions Detected</p>
                  <p className="text-gray-400 text-sm mt-1">Document passed heatmap analysis</p>
                </div>
              </div>
            ) : (
              <>
                {regions.map((region: any, idx: number) => (
                  <div key={idx}
                    className={`absolute border-2 rounded ${colorMap[region.type] || 'bg-red-500/50 border-red-400'}`}
                    style={{
                      left: `${(region.x / 400) * 100}%`,
                      top: `${(region.y / 560) * 100}%`,
                      width: `${(region.width / 400) * 100}%`,
                      height: `${(region.height / 560) * 100}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 text-xs text-white bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {(region.type || 'anomaly').replace(/_/g, ' ')} — {Math.round(region.confidence * 100)}%
                    </span>
                  </div>
                ))}
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-black/60 px-2 py-1 rounded">
                  {regions.length} suspicious region{regions.length !== 1 ? 's' : ''} flagged
                </div>
              </>
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { color: 'bg-red-500', label: 'Text modification' },
              { color: 'bg-orange-500', label: 'Copy-move detection' },
              { color: 'bg-yellow-500', label: 'Compression anomaly' },
              { color: 'bg-blue-500', label: 'Minor inconsistency' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <div className={`w-3 h-3 rounded-sm ${item.color} opacity-70`} />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  const renderTextAnalysis = () => {
    const results = analysisResults || selectedDocument?.results
    const textAnalysis = results?.forensics?.textAnalysis

    if (!textAnalysis) {
      return (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white dark:text-white mb-2">
            No Text Analysis Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This document does not contain extracted text, font, or signature data yet.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Text Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Extracted Text</h4>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-72 overflow-auto">
                {textAnalysis.extractedText || 'No extracted text available.'}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Font Consistency</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {textAnalysis.fontConsistency.toFixed(1)}%
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Alignment Issues</h4>
                {textAnalysis.alignmentIssues?.length ? (
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {textAnalysis.alignmentIssues.map((issue: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No alignment anomalies detected.</p>
                )}
              </div>
              {textAnalysis.signatureVerification && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Signature Verification</h4>
                  <p className={`text-sm font-semibold ${textAnalysis.signatureVerification.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {textAnalysis.signatureVerification.isValid ? 'Valid signature detected' : 'Signature mismatch detected'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {textAnalysis.signatureVerification.confidence.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderComparison = () => {
    const completed = state.documents.filter((doc) => doc.status === 'completed' && doc.results)
    if (completed.length < 2 || !selectedDocument?.results) {
      return (
        <div className="text-center py-12">
          <AdjustmentsHorizontalIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white dark:text-white mb-2">
            Comparison Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload and complete at least two documents to compare their analysis results.
          </p>
        </div>
      )
    }

    const selectedScore = selectedDocument.results.authenticity.score
    const selectedConfidence = selectedDocument.results.authenticity.confidence
    const peerDocuments = completed.filter((doc) => doc.id !== selectedDocument.id && Boolean(doc.results))
    const peerAverageScore = peerDocuments.reduce((sum, doc) => sum + doc.results!.authenticity.score, 0) / peerDocuments.length
    const peerAverageConfidence = peerDocuments.reduce((sum, doc) => sum + doc.results!.authenticity.confidence, 0) / peerDocuments.length

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Document Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Selected Document</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{selectedDocument.filename}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedScore.toFixed(1)}%</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Confidence: {selectedConfidence.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Peer Average</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{peerDocuments.length} other completed document{peerDocuments.length === 1 ? '' : 's'}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{peerAverageScore.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Confidence: {peerAverageConfidence.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Compared Documents</h4>
            <div className="space-y-3">
              {peerDocuments.slice(0, 4).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg bg-white/5 dark:bg-gray-700/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{doc.filename}</p>
                    <p className="text-xs text-gray-400 capitalize">{doc.results!.authenticity.category.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{doc.results!.authenticity.score.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">{doc.results!.authenticity.confidence.toFixed(1)}% confidence</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderMetadata = () => {
    const results = analysisResults || selectedDocument?.results
    
    if (!results?.forensics?.metadataAnalysis) {
      return (
        <div className="text-center py-12">
          <InformationCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white dark:text-white mb-2">
            No Metadata Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Metadata analysis is not available for this document.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Document Metadata
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">EXIF Data</h4>
              <div className="space-y-2">
                {Object.entries(results.forensics.metadataAnalysis.exifData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Creation Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-sm">
                    {new Date(results.forensics.metadataAnalysis.creationDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeMode) {
      case 'overview': return renderOverview()
      case 'heatmap': return renderHeatmap()
      case 'metadata': return renderMetadata()
      case 'text': return renderTextAnalysis()
      case 'comparison': return renderComparison()
      default: return renderOverview()
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white dark:text-white">
            Forensic Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep document examination and tampering detection
          </p>
        </div>
        
        {state.documents.length > 0 && (
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Document</option>
            {state.documents.filter(doc => doc.status === 'completed' || doc.status === 'blocked').map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {modes.map((mode) => {
          const Icon = mode.icon
          const available = isModeAvailable(mode.id)
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id as AnalysisMode)}
              title={!available && mode.id !== 'overview' ? 'No data available yet for this view' : undefined}
              aria-disabled={!available && mode.id !== 'overview'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeMode === mode.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : available
                    ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{mode.name}</span>
            </button>
          )
        })}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}