import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeScript from '@/components/ThemeScript'
import ThemeToggle from '@/components/ThemeToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Landed — Your Immigration Roadmap',
  description: 'Personalized step-by-step guide for international students navigating US immigration bureaucracy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeScript />
        {children}
        <div className="fixed bottom-5 right-5 z-[60]">
          <ThemeToggle />
        </div>
      </body>
    </html>
  )
}
