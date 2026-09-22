import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { CookieBanner } from '@/components/cookie-banner'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lumin AI CRM · Soluções Diferentes',
  description: 'Plataforma CRM de vendas, parceiros, energia e telecomunicações desenvolvida pela Lumin AI para a Soluções Diferentes',
  icons: { icon: '/lumin-ai-icon.svg', apple: '/lumin-ai-icon.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lumin AI CRM',
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
    { media: '(prefers-color-scheme: light)', color: '#050812' },
    { media: '(prefers-color-scheme: dark)', color: '#050812' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
