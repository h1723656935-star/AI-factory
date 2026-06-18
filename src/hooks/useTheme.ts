import { useEffect, useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

export interface UseThemeReturn {
  theme: string | undefined
  setTheme: (theme: string) => void
  toggleTheme: () => void
  resolvedTheme: string | undefined
  systemTheme: string | undefined
  themes: string[]
  mounted: boolean
}

export function useTheme(): UseThemeReturn {
  const { theme, setTheme, resolvedTheme, systemTheme, themes } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = (): void => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme,
    systemTheme,
    themes: themes || ['light', 'dark'],
    mounted,
  }
}
