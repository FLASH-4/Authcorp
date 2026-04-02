'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { useForensics } from '@/components/forensics-provider'

interface RiskIntelligenceProps {
  data?: any
}

type RiskCategory = 'low' | 'medium' | 'high'
type FindingType = 'criminal' | 'sanctions' | 'fraud' | 'breach' | 'regulatory'

interface RiskFinding {
  type: FindingType
  description: string
  confidence: number
  source: string
  date?: string
  severity: 'low' | 'medium' | 'high'
}

interface PersonProfile {
  name: string
  dateOfBirth?: string
  nationality?: string
  identificationNumbers: string[]
  addresses: string[]
  phoneNumbers: string[]
  emailAddresses: string[]
}

export function RiskIntelligence({ data }: RiskIntelligenceProps) {
  const { state } = useForensics()
  const [selectedDocument, setSelectedDocument] = useState(state.activeDocument || state.documents[0])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'profile' | 'timeline'>('overview')
  
  // Mock extracted person data
  const [personProfile] = useState<PersonProfile>({
    name: 'John Michael Smith',
    dateOfBirth: '1985-03-15',
    nationality: 'United States',
    identificationNumbers: ['SSN: ***-**-1234', 'DL: D123456789'],
    addresses: ['123 Main St, New York, NY 10001', '456 Oak Ave, Los Angeles, CA 90210'],
    phoneNumbers: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
    emailAddresses: ['john.smith@email.com', 'j.smith@company.com']
  })
  
  // Mock risk findings
  const [riskFindings] = useState<RiskFinding[]>([
    {
      type: 'criminal',
      description: 'Minor traffic violation - Speeding ticket',
      confidence: 95,
      source: 'State DMV Records',
      date: '2023-08-15',
      severity: 'low'
    },
    {
      type: 'breach',
      description: 'Email found in LinkedIn data breach (2021)',
      confidence: 88,
      source: 'HaveIBeenPwned Database',
      date: '2021-06-01',
      severity: 'medium'
    },
    {
      type: 'fraud',
      description: 'Similar name flagged in financial fraud case',
      confidence: 45,
      source: 'Commercial Fraud Database',
      date: '2022-11-20',
      severity: 'low'
    }
  ])
  
  const [riskScore] = useState(25) // 0-100 scale
  const [riskCategory] = useState<RiskCategory>('low')
  
  useEffect(() => {
    if (selectedDocument && selectedDocument.status === 'completed' && !selectedDocument.results?.riskIntelligence) {
      performRiskCheck()
    }
  }, [selectedDocument])

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedDocument && selectedDocument.status === 'analyzing') {
        // Simulate progress updates
        const progress = Math.min((selectedDocument.progress || 0) + Math.random() * 10, 100)
        // Update document progress (this would normally come from the backend)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [selectedDocument])
  
  const performRiskCheck = async () => {
    setIsSearching(true)
    setSearchProgress(0)
    
    // Simulate progressive search across different databases
    const searchSteps = [
      { name: 'Criminal Records', duration: 1000 },
      { name: 'Sanctions Lists', duration: 800 },
      { name: 'Fraud Databases', duration: 1200 },
      { name: 'Data Breach Records', duration: 600 },
      { name: 'Regulatory Lists', duration: 900 },
      { name: 'News Archives', duration: 700 }
    ]
    
    for (let i = 0; i < searchSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, searchSteps[i].duration))
      setSearchProgress(((i + 1) / searchSteps.length) * 100)
    }
    
    setIsSearching(false)
    
    // Emit risk check completed event for dashboard updates
    window.dispatchEvent(new CustomEvent('risk-check-completed', { 
      detail: { 
        document: selectedDocument, 
        riskResults: { riskScore, riskCategory, riskFindings } 
      } 
    }))
  }
  
  const getRiskColor = (category: RiskCategory) => {
    switch (category) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
    }
  }
  
  const getFindingTypeColor = (type: FindingType) => {
    switch (type) {
      case 'criminal': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'sanctions': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'fraud': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'breach': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'regulatory': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20'
    }
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return XCircleIcon
      case 'medium': return ExclamationTriangleIcon
      case 'low': return InformationCircleIcon
      default: return InformationCircleIcon
    }
  }
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Risk Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Risk Assessment
          </h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            getRiskColor(riskCategory)
          }`}>
            <ShieldCheckIcon className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{riskCategory} Risk</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Risk Score</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {riskScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <motion.div
                className={`h-4 rounded-full ${
                  riskScore <= 30 ? 'bg-green-500' :
                  riskScore <= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${riskScore}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Findings</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {riskFindings.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">High Severity</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {riskFindings.filter(f => f.severity === 'high').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Search Progress */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Searching Intelligence Databases
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-gray-900 dark:text-white">{searchProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${searchProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Identity Verified
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Person profile extracted
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <GlobeAltIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                6 Databases
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sources checked
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Real-time
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Live monitoring
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
  
  const renderFindings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Risk Intelligence Findings ({riskFindings.length})
        </h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Export Report
        </button>
      </div>
      
      {riskFindings.map((finding, index) => {
        const SeverityIcon = getSeverityIcon(finding.severity)
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${
                  finding.severity === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                  finding.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                  <SeverityIcon className={`w-5 h-5 ${
                    finding.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                    finding.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getFindingTypeColor(finding.type)
                    }`}>
                      {finding.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      finding.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {finding.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {finding.description}
                  </h4>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Source: {finding.source}</span>
                    {finding.date && <span>Date: {new Date(finding.date).toLocaleDateString()}</span>}
                    <span>Confidence: {finding.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <EyeIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
  
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Extracted Person Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{personProfile.name}</p>
            </div>
            
            {personProfile.dateOfBirth && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(personProfile.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {personProfile.nationality && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nationality</label>
                <p className="text-gray-900 dark:text-white">{personProfile.nationality}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Identification Numbers</label>
              <div className="space-y-1">
                {personProfile.identificationNumbers.map((id, index) => (
                  <p key={index} className="text-gray-900 dark:text-white font-mono text-sm">{id}</p>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone Numbers</label>
              <div className="space-y-1">
                {personProfile.phoneNumbers.map((phone, index) => (
                  <p key={index} className="text-gray-900 dark:text-white font-mono text-sm">{phone}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Addresses</label>
            <div className="space-y-1">
              {personProfile.addresses.map((address, index) => (
                <p key={index} className="text-gray-900 dark:text-white">{address}</p>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Addresses</label>
            <div className="space-y-1">
              {personProfile.emailAddresses.map((email, index) => (
                <p key={index} className="text-gray-900 dark:text-white font-mono text-sm">{email}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  
  const tabs = [
    { id: 'overview', name: 'Overview', icon: ShieldCheckIcon },
    { id: 'findings', name: 'Findings', icon: ExclamationTriangleIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'timeline', name: 'Timeline', icon: ClockIcon },
  ]
  
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'findings': return renderFindings()
      case 'profile': return renderProfile()
      case 'timeline': return renderOverview() // Placeholder
      default: return renderOverview()
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Risk Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Background checks and criminal intelligence analysis
          </p>
        </div>
        
        {/* Document Selector */}
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
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          )
        })}
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
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