import { WebsiteHeader } from '@/components/website/header'
import { WebsiteFooter } from '@/components/website/footer'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebsiteHeader />
      <main>{children}</main>
      <WebsiteFooter />
    </>
  )
}
