import { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { NextUIProvider } from '@nextui-org/react'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <NextUIProvider>
        <Component {...pageProps} />
      </NextUIProvider>
    </ThemeProvider>
  )
}