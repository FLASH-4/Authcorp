'use client'

import { motion } from 'framer-motion'
import { HeroIcon } from '@/types/icons'

interface NavigationItem {
  id: string
  name: string
  icon: HeroIcon
  description: string
}

interface NavigationProps {
  items: NavigationItem[]
  activeView: string
  onViewChange: (view: string) => void
}

export function Navigation({ items, activeView, onViewChange }: NavigationProps) {
  return (
    <nav className="space-y-1">
      {items.map((item, index) => {
        const isActive = activeView === item.id
        const Icon = item.icon
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
              isActive
                ? 'text-white neon-border'
                : 'text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
            style={isActive ? { background: 'linear-gradient(135deg, rgba(0,255,240,0.12), rgba(56,189,248,0.12))' } : {}}
          >
            <div className={`p-2 rounded-lg transition-all ${
              isActive 
                ? 'bg-white/10' 
                : 'bg-white/5 group-hover:bg-white/10'
            }`}>
              <Icon className={`w-5 h-5 transition-all ${
                isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`font-medium block truncate ${
                isActive ? 'text-white' : 'text-white'
              }`}>
                {item.name}
              </span>
              <p className={`text-xs mt-0.5 truncate ${
                isActive ? 'text-blue-200' : 'text-gray-300'
              }`}>
                {item.description}
              </p>
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="w-2 h-2 bg-white rounded-full shadow-sm"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {!isActive && (
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </motion.button>
        )
      })}
      
      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Documents Today</span>
            <span className="text-sm font-semibold text-white">24</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Authenticity Rate</span>
            <span className="text-sm font-semibold text-green-400">94.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">High Risk Flags</span>
            <span className="text-sm font-semibold text-red-400">3</span>
          </div>
        </div>
      </div>
      
      {/* System Health */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          System Health
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-300">AI Engine</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-300">Database</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-xs text-gray-300">Risk Intel API</span>
          </div>
        </div>
      </div>
    </nav>
  )
}