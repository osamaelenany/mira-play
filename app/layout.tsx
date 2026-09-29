import './globals.css'
export const metadata = { title: 'Mira Play', description: 'Community court booking' }
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>
}
