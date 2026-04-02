'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

interface CustomThemeProviderProps extends Omit<ThemeProviderProps, 'attribute' | 'defaultTheme'> {
  children: React.ReactNode
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the provider, but handle hydration mismatch with CSS
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="authcorp-theme"
      themes={['light', 'dark']}
      forcedTheme={!mounted ? 'light' : undefined}
      {...props}
    >
      <div className={!mounted ? 'light' : ''}>
        {children}
      </div>
    </NextThemesProvider>
  )
}