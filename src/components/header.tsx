'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useAuth } from '@/components/auth-provider'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [notifications] = useState([
    {
      id: 1,
      title: 'High-risk document detected',
      message: 'Document ID_2024_001 flagged for manual review',
      time: '2 min ago',
      type: 'warning'
    },
    {
      id: 2,
      title: 'Analysis completed',
      message: 'Passport verification finished with 98% confidence',
      time: '5 min ago',
      type: 'success'
    }
  ])

  return (
    <header className="glass-card neon-border sticky top-0 z-50">
      <div className="mobile-container py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 sm:space-x-3"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))'
              }}>
                <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  AuthCorp
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  AI-Powered Document Verification
                </p>
              </div>
            </motion.div>
          </div>

          {/* Mobile Status Indicators */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* System Status - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                All Systems Operational
              </span>
            </div>

            {/* Active Analyses Counter - Mobile optimized */}
            <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-full" style={{
              background: 'linear-gradient(90deg, rgba(56,189,248,0.12), rgba(0,255,240,0.12))'
            }}>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-blue-300">
                <span className="hidden sm:inline">3 Active Analyses</span>
                <span className="sm:hidden">3 Active</span>
              </span>
            </div>
            
            {/* Mobile Deepfake Alert */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full" style={{
              background: 'linear-gradient(90deg, rgba(255,0,234,0.12), rgba(0,255,240,0.08))'
            }}>
              <span className="text-xs font-medium text-red-300">
                🚨 <span className="hidden sm:inline">Deepfakes:</span> 3
              </span>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-white/80" />
              ) : (
                <MoonIcon className="w-5 h-5 text-white/80" />
              )}
            </motion.button>

            {/* Notifications */}
            <Menu as="div" className="relative">
              <Menu.Button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <BellIcon className="w-5 h-5 text-white/80" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-80 glass-card focus:outline-none">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Professional Notifications
                    </h3>
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-1 ${
                              notification.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-300 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Enhanced User Menu */}
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200">
                  <div className="relative">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-blue))'
                      }}>
                        <span className="text-sm font-semibold text-white">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-white">
                      {user?.name || 'Research Team'}
                    </p>
                    <p className="text-xs text-gray-300">
                      Administrator
                    </p>
                  </div>
                </Menu.Button>
                
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-64 glass-card focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-4 border-b border-white/10" style={{
                        background: 'linear-gradient(90deg, rgba(56,189,248,0.08), rgba(0,255,240,0.06))'
                      }}>
                        <p className="text-sm font-semibold text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-300">
                          {user.email}
                        </p>
                        <p className="text-xs text-blue-300 font-medium capitalize mt-1">
                          {user.role} • Final Year Project
                        </p>
                      </div>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${active ? 'bg-white/10' : ''}
                              flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors`}
                          >
                            <UserCircleIcon className="w-4 h-4 mr-3" />
                            Profile Settings
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${active ? 'bg-white/10' : ''}
                              flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors`}
                          >
                            <Cog6ToothIcon className="w-4 h-4 mr-3" />
                            System Preferences
                          </button>
                        )}
                      </Menu.Item>
                      <hr className="my-1 border-gray-200" />
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`${active ? 'bg-white/10' : ''}
                              flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors`}
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                Sign In
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}