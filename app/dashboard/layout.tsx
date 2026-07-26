import Sidebar from '@/components/sidebar'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {children}
      </main>
    </div>
  )
}