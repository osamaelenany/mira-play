import './globals.css'
import { BrandingProvider } from '@/components/Branding'
export const metadata = { title: 'Mira Play', description: 'Community court booking' }
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><BrandingProvider>{children}</BrandingProvider></body></html>
}
