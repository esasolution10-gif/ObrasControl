import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VG Pinturas — Gestão de Obras',
  description: 'Construindo qualidade, pintando confiança.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
