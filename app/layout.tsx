import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ChatbotWrapper } from '@/components/chatbot-wrapper'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solucoes Diferentes - CRM',
  description: 'Plataforma de gestao de vendas para parceiros',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <ChatbotWrapper />
      </body>
    </html>
  )
}
