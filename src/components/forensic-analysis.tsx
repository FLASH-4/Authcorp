'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const analysisResults = data || selectedDocument?.results

  const modes = [
    { id: 'overview', name: 'Overview', icon: EyeIcon },
    { id: 'heatmap', name: 'Heatmap', icon: ChartBarIcon },
    { id: 'metadata', name: 'Metadata', icon: InformationCircleIcon },
    { id: 'text', name: 'Text Analysis', icon: DocumentTextIcon },
    { id: 'comparison', name: 'Comparison', icon: AdjustmentsHorizontalIcon },
  ]

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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
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
              {results.authenticity.reasoning.map((reason, index) => (
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
    if (!selectedDocument?.results?.heatmap) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Heatmap Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Heatmap analysis is not available for this document.
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
            Tampering Heatmap
          </h3>
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-4 min-h-96">
            <div className="text-center py-20">
              <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Interactive heatmap visualization would appear here
              </p>
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
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
                    <span className="text-gray-900 dark:text-white font-mono text-sm">{value}</span>
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
      case 'text': return renderOverview()
      case 'comparison': return renderOverview()
      default: return renderOverview()
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Forensic Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep document examination and tampering detection
          </p>
        </div>
        
        {state.documents.length > 0 && (
          <select
            value={selectedDocument?.id || ''}
            onChange={(e) => {
              const doc = state.documents.find(d => d.id === e.target.value)
              setSelectedDocument(doc || null)
            }}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Document</option>
            {state.documents.filter(doc => doc.status === 'completed').map(doc => (
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
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id as AnalysisMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeMode === mode.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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