'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CpuChipIcon,
  GlobeAltIcon,

} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useForensics } from '@/components/forensics-provider'
import { dataService, RealTimeStats, RecentActivity, TrendData, SystemHealth } from '@/lib/data-service'

interface DashboardProps {
  analysisData?: any
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6']

export function Dashboard({ analysisData }: DashboardProps) {
  const { state } = useForensics()
  const [timeRange, setTimeRange] = useState('7d')
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load real-time data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [stats, activity, trends, health] = await Promise.all([
          dataService.getRealTimeStats(),
          dataService.getRecentActivity(10),
          dataService.getTrendData(7),
          dataService.getSystemHealth()
        ])
        
        setRealTimeStats(stats)
        setRecentActivity(activity)
        setTrendData(trends)
        setSystemHealth(health)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Subscribe to real-time updates
    const unsubscribeStats = dataService.subscribe('stats_updated', setRealTimeStats)
    const unsubscribeActivity = dataService.subscribe('activity_updated', setRecentActivity)
    const unsubscribeHealth = dataService.subscribe('health_updated', setSystemHealth)

    // Listen for user activities to trigger dashboard updates
    const handleUserActivity = () => {
      // Refresh data when user performs activities
      loadData()
    }

    // Listen for document upload/analysis events
    window.addEventListener('document-uploaded', handleUserActivity)
    window.addEventListener('analysis-completed', handleUserActivity)
    window.addEventListener('risk-check-completed', handleUserActivity)

    return () => {
      unsubscribeStats()
      unsubscribeActivity()
      unsubscribeHealth()
      window.removeEventListener('document-uploaded', handleUserActivity)
      window.removeEventListener('analysis-completed', handleUserActivity)
      window.removeEventListener('risk-check-completed', handleUserActivity)
    }
  }, [timeRange])

  // Transform trend data for charts
  const weeklyData = trendData.map(item => ({
    day: new Date(item.date).toLocaleDateString('en', { weekday: 'short' }),
    authentic: item.authentic,
    tampered: item.tampered,
    forged: item.forged,
    aiGenerated: item.aiGenerated
  }))

  const riskTrendData = trendData.map(item => ({
    time: new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    riskScore: item.riskScore
  }))

  const categoryData = realTimeStats ? [
    { name: 'Authentic', value: weeklyData.reduce((sum, day) => sum + day.authentic, 0), color: '#10b981' },
    { name: 'Tampered', value: weeklyData.reduce((sum, day) => sum + day.tampered, 0), color: '#ef4444' },
    { name: 'Forged', value: weeklyData.reduce((sum, day) => sum + day.forged, 0), color: '#f59e0b' },
    { name: 'AI Generated', value: weeklyData.reduce((sum, day) => sum + day.aiGenerated, 0), color: '#8b5cf6' },
  ] : []

  const stats = realTimeStats ? [
    {
      title: 'Documents Processed',
      value: realTimeStats.documentsProcessed.toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: DocumentTextIcon,
      color: 'blue',
    },
    {
      title: 'Authenticity Rate',
      value: `${realTimeStats.authenticityRate.toFixed(1)}%`,
      change: '+2.1%',
      trend: 'up' as const,
      icon: ShieldCheckIcon,
      color: 'green',
    },
    {
      title: 'High Risk Flags',
      value: realTimeStats.highRiskFlags.toString(),
      change: '-8.3%',
      trend: 'down' as const,
      icon: ExclamationTriangleIcon,
      color: 'red',
    },
    {
      title: 'Avg Processing Time',
      value: `${realTimeStats.avgProcessingTime.toFixed(1)}s`,
      change: '-15.2%',
      trend: 'down' as const,
      icon: ClockIcon,
      color: 'purple',
    },
  ] : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-300">Loading dashboard...</span>
      </div>
    )
  }
  
  const getResultColor = (result: string) => {
    switch (result) {
      case 'authentic': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'tampered': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'forged': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'ai_generated': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'high_risk': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Forensics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Real-time document verification and deepfake detection
          </p>
        </div>
        
        {/* Mobile-Friendly Deepfake Alert */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          🚨 3 Deepfakes Detected Today
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white/5 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>
      
      {/* Deepfake Detection Showcase */}
      <div className="bg-gradient-to-r from-red-50 via-pink-50 to-purple-50 dark:from-red-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border-2 border-red-200 dark:border-red-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              🤖 AI Deepfake Detection Engine
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300">
              Advanced neural networks detecting synthetic content with 98.5% accuracy
            </p>
          </div>
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            ACTIVE
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
           <div className="text-center">
             <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
               {realTimeStats?.deepfakesDetected || 0}
             </div>
             <div className="text-xs sm:text-sm text-red-700 dark:text-red-300">Deepfakes Blocked</div>
           </div>
           <div className="text-center">
             <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
               {realTimeStats?.faceSwapsDetected || 0}
             </div>
             <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">Face Swaps</div>
           </div>
           <div className="text-center">
             <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
               {realTimeStats?.ganGeneratedDetected || 0}
             </div>
             <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">GAN Generated</div>
           </div>
           <div className="text-center">
             <div className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
               {realTimeStats?.accuracyRate.toFixed(1) || 0}%
             </div>
             <div className="text-xs sm:text-sm text-pink-700 dark:text-pink-300">Accuracy Rate</div>
           </div>
         </div>
      </div>
      
      {/* Mobile-Optimized Stats Grid */}
      <div className="mobile-grid gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mobile-card bg-white/5 dark:bg-gray-800 border border-white/10 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-white">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  {stat.title}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Analysis Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 dark:bg-gray-800 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Weekly Analysis Results
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Bar dataKey="authentic" stackId="a" fill="#10b981" />
              <Bar dataKey="tampered" stackId="a" fill="#ef4444" />
              <Bar dataKey="forged" stackId="a" fill="#f59e0b" />
              <Bar dataKey="aiGenerated" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        
        {/* Risk Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 dark:bg-gray-800 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Risk Score Trend (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Line
                type="monotone"
                dataKey="riskScore"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      
      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 dark:bg-gray-800 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Document Categories
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-300">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white/5 dark:bg-gray-800 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-white/5 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'analysis' ? (
                      <EyeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activity.document}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    getResultColor(activity.result)
                  }`}>
                    {activity.result.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-300">
                    {activity.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Active Documents Status */}
      {state.documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 dark:bg-gray-800 rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Current Session Documents ({state.documents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.documents.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white/5 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white truncate">
                    {doc.filename}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    doc.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    doc.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                {doc.results && (
                  <div className="text-xs text-gray-300">
                    {doc.results.authenticity.category} • {doc.results.authenticity.score.toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}