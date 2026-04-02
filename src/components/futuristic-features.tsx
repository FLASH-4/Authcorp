'use client'

import { useState, useRef, useEffect } from 'react'
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
} from '@heroicons/react/24/outline'
import { useForensics } from '@/components/forensics-provider'

interface FuturisticFeaturesProps {
  activeDocument?: any
}

type FeatureMode = 'ar' | 'blockchain' | 'ai-assistant' | 'simulation' | 'monitoring'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function FuturisticFeatures({ activeDocument }: FuturisticFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<FeatureMode>('ar')
  const [isARActive, setIsARActive] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI Forensics Assistant. I can help explain analysis results, suggest investigation strategies, and answer questions about document verification.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const features = [
    {
      id: 'ar',
      name: 'AR Forensics',
      icon: CubeTransparentIcon,
      description: 'Augmented reality document analysis'
    },
    {
      id: 'blockchain',
      name: 'Blockchain Anchoring',
      icon: LinkIcon,
      description: 'Immutable verification records'
    },
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      icon: ChatBubbleLeftRightIcon,
      description: 'Intelligent forensics guidance'
    },
    {
      id: 'simulation',
      name: 'Threat Simulation',
      icon: BeakerIcon,
      description: 'Fraud scenario testing'
    },
    {
      id: 'monitoring',
      name: 'Continuous Monitoring',
      icon: EyeIcon,
      description: 'Real-time threat detection'
    }
  ]

  // AR Forensics Component
  const ARForensics = () => {
    const [arOverlays, setArOverlays] = useState([
      {
        id: '1',
        type: 'tamper_highlight',
        x: 150,
        y: 200,
        width: 100,
        height: 50,
        confidence: 0.85,
        description: 'Potential text modification'
      },
      {
        id: '2',
        type: 'metadata_info',
        x: 50,
        y: 100,
        width: 200,
        height: 30,
        confidence: 0.92,
        description: 'Original creation timestamp'
      }
    ])

    const startARSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsARActive(true)
        }
      } catch (error) {
        console.error('AR camera access failed:', error)
      }
    }

    const stopARSession = () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
        setIsARActive(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AR Document Analysis
          </h3>
          
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
                
                {/* AR Overlays */}
                {arOverlays.map((overlay) => (
                  <motion.div
                    key={overlay.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute border-2 border-red-500 bg-red-500/20 rounded"
                    style={{
                      left: `${overlay.x}px`,
                      top: `${overlay.y}px`,
                      width: `${overlay.width}px`,
                      height: `${overlay.height}px`,
                    }}
                  >
                    <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {(overlay.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="absolute -bottom-6 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded max-w-48">
                      {overlay.description}
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="w-full h-64 flex items-center justify-center">
                <div className="text-center">
                  <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Point your camera at a document to start AR analysis
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              {!isARActive ? (
                <button
                  onClick={startARSession}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>Start AR Session</span>
                </button>
              ) : (
                <button
                  onClick={stopARSession}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopIcon className="w-4 h-4" />
                  <span>Stop AR Session</span>
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {arOverlays.length} suspicious regions detected
            </div>
          </div>
        </div>
        
        {/* AR Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <SparklesIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
              Real-time Overlay
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Live forensic analysis with AR visualization
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <EyeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              3D Analysis
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Three-dimensional document examination
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <CubeTransparentIcon className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
              Holographic Display
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Advanced holographic visualization
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Blockchain Anchoring Component
  const BlockchainAnchoring = () => {
    const [blockchainRecords] = useState([
      {
        id: '1',
        hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        documentId: 'doc_001',
        status: 'confirmed',
        blockNumber: 18234567,
        network: 'Ethereum'
      },
      {
        id: '2',
        hash: '0x9876543210fedcba0987654321fedcba09876543',
        timestamp: new Date('2024-01-15T11:45:00Z'),
        documentId: 'doc_002',
        status: 'pending',
        blockNumber: null,
        network: 'Polygon'
      }
    ])

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Blockchain Document Registry
          </h3>
          
          <div className="space-y-4">
            {blockchainRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {record.documentId}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {record.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hash:</span>
                    <p className="font-mono text-gray-900 dark:text-white break-all">
                      {record.hash}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <p className="text-gray-900 dark:text-white">{record.network}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                    <p className="text-gray-900 dark:text-white">
                      {record.timestamp.toLocaleString()}
                    </p>
                  </div>
                  {record.blockNumber && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Block:</span>
                      <p className="text-gray-900 dark:text-white">{record.blockNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Anchor Current Document
          </button>
        </div>
        
        {/* Blockchain Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Immutable Verification
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Document hashes are permanently stored on blockchain for tamper-proof verification.
            </p>
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Cryptographically Secured</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Multi-Chain Support
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Support for Ethereum, Polygon, and other blockchain networks.
            </p>
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <GlobeAltIcon className="w-4 h-4" />
              <span>Cross-Chain Compatible</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // AI Assistant Component
  const AIAssistant = () => {
    const sendMessage = async () => {
      if (!inputMessage.trim()) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: inputMessage,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, userMessage])
      const currentInput = inputMessage
      setInputMessage('')
      setIsTyping(true)

      // Enhanced AI response with context awareness
      setTimeout(() => {
        let response = generateIntelligentResponse(currentInput, activeDocument)
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date()
        }

        setChatMessages(prev => [...prev, assistantMessage])
        setIsTyping(false)
      }, 1500)
    }

    const generateIntelligentResponse = (userInput: string, document: any): string => {
      const input = userInput.toLowerCase()
      
      // Context-aware responses based on user input
      if (input.includes('metadata') || input.includes('exif')) {
        return "The metadata indicates the document was created with Adobe Photoshop, which is unusual for authentic government documents. This raises authenticity concerns. I recommend verifying the creation software against official document standards."
      }
      
      if (input.includes('signature') || input.includes('sign')) {
        return "Based on the analysis, this document shows signs of digital manipulation in the signature area. The pressure patterns and ink flow appear inconsistent with natural handwriting. I recommend conducting additional biometric verification."
      }
      
      if (input.includes('font') || input.includes('text')) {
        return "The font consistency analysis reveals multiple typefaces, suggesting potential text replacement. Cross-reference with official document templates to verify authenticity."
      }
      
      if (input.includes('ai') || input.includes('deepfake') || input.includes('generated')) {
        return "AI detection algorithms identified characteristic GAN artifacts. This document appears to be synthetically generated with 87% confidence. The neural network patterns suggest StyleGAN2 architecture was used."
      }
      
      if (input.includes('risk') || input.includes('background') || input.includes('check')) {
        return "The risk intelligence check flagged the associated individual in sanctions databases. Proceed with enhanced due diligence and cross-reference with additional verification sources."
      }
      
      if (input.includes('authentic') || input.includes('real') || input.includes('genuine')) {
        return "Based on multi-layer analysis, this document shows mixed authenticity indicators. While some elements appear genuine, there are concerning artifacts that require manual expert review."
      }
      
      if (input.includes('help') || input.includes('how') || input.includes('what')) {
        return "I can help you understand document analysis results, explain forensic findings, suggest investigation strategies, and provide guidance on verification procedures. What specific aspect would you like me to explain?"
      }
      
      // Default intelligent responses
      const defaultResponses = [
        "Based on the comprehensive analysis, I've identified several key indicators that require attention. The document exhibits characteristics that warrant further investigation.",
        "The forensic analysis reveals interesting patterns. I recommend focusing on the metadata inconsistencies and cross-referencing with known authentic samples.",
        "From an investigative perspective, this case presents multiple verification challenges. Let me guide you through the most critical findings.",
        "The AI detection systems have flagged several areas of concern. I suggest prioritizing the biometric verification and document structure analysis.",
        "This analysis shows complex authenticity patterns. I recommend a multi-pronged verification approach focusing on both technical and contextual evidence."
      ]
      
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-96 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Forensics Assistant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Intelligent analysis guidance
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  e.preventDefault()
                  setInputMessage(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                  }
                }}
                placeholder="Ask about document analysis..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isTyping ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Thinking...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* AI Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
              Expert Guidance
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              AI-powered forensic analysis explanations
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <BeakerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Investigation Strategy
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Intelligent case analysis recommendations
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <SparklesIcon className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
              Pattern Recognition
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Advanced fraud pattern detection
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderFeature = () => {
    switch (activeFeature) {
      case 'ar': return <ARForensics />
      case 'blockchain': return <BlockchainAnchoring />
      case 'ai-assistant': return <AIAssistant />
      case 'simulation': return <div className="text-center py-12 text-gray-500">Threat Simulation - Coming Soon</div>
      case 'monitoring': return <div className="text-center py-12 text-gray-500">Continuous Monitoring - Coming Soon</div>
      default: return <ARForensics />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Futuristic Features
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Next-generation forensic technologies and AI-powered capabilities
        </p>
      </div>
      
      {/* Feature Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id as FeatureMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeFeature === feature.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{feature.name}</span>
            </button>
          )
        })}
      </div>
      
      {/* Feature Content */}
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