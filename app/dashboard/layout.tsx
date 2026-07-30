import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--bg-body)' }}>
        {children}
      </main>
    </div>
  )
}
