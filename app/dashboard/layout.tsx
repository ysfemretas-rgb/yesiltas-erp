import Sidebar from '@/components/sidebar'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  )
}