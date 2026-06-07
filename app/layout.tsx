import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { CookieBanner } from '@/components/cookie-banner'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Soluções Diferentes - CRM',
  description: 'Plataforma de gestão de vendas para parceiros',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Soluções Diferentes',
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0066cc' },
    { media: '(prefers-color-scheme: dark)', color: '#0066cc' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className="scroll-smooth">
      <body className="font-sans antialiased bg-background text-foreground" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)', minHeight: '100vh' }}>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
