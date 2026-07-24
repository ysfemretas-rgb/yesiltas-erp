import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wrench, Package, DollarSign, Users, 
  TrendingUp, TrendingDown, Clock, CheckCircle 
} from 'lucide-react'

async function getDashboardData() {
  const supabase = createClient()

  const { data: metrics } = await supabase
    .from('dashboard_metrics')
    .select('*')
    .single()

  const { data: todayServices } = await supabase
    .from('service_orders')
    .select('*, service_statuses(name, color)')
    .gte('created_at', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: lowStock } = await supabase
    .from('stock_items')
    .select('*')
    .lte('quantity', 10)
    .gt('min_stock', 0)
    .order('quantity', { ascending: true })
    .limit(5)

  return { metrics, todayServices, lowStock }
}

export default async function DashboardPage() {
  const { metrics, todayServices, lowStock } = await getDashboardData()

  const stats = [
    {
      title: 'Bugunku Servis',
      value: metrics?.today_services || 0,
      icon: Wrench,
      trend: '+12%',
      trendUp: true,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Bekleyen Is',
      value: metrics?.pending_services || 0,
      icon: Clock,
      trend: '5 acil',
      trendUp: false,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Bugunku Ciro',
      value: `₺${(metrics?.today_revenue || 0).toLocaleString('tr-TR')}`,
      icon: DollarSign,
      trend: '+8%',
      trendUp: true,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Toplam Musteri',
      value: metrics?.total_customers || 0,
      icon: Users,
      trend: '+3 yeni',
      trendUp: true,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trendUp ? (
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-amber-500" />
                    )}
                    <span className={stat.trendUp ? 'text-emerald-500' : 'text-amber-500'}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Bugunku Servisler</CardTitle>
              <a href="/services" className="text-xs text-primary hover:underline">
                Tumunu Gor
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayServices && todayServices.length > 0 ? (
                todayServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{service.service_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.device_brand} {service.device_model}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: (service.service_statuses as any)?.color + '20',
                          color: (service.service_statuses as any)?.color 
                        }}
                      >
                        {(service.service_statuses as any)?.name}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        ₺{service.total_amount?.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Bugun henuz servis kaydi yok</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-destructive" />
                Dusuk Stok Uyarlari
              </CardTitle>
              <a href="/stock" className="text-xs text-primary hover:underline">
                Tumunu Gor
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStock && lowStock.length > 0 ? (
                lowStock.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">
                        {item.quantity} adet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.min_stock}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Dusuk stok uyarisi yok</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Hizli Islemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Yeni Servis', href: '/services/new', icon: Wrench, color: 'bg-blue-500' },
              { label: 'Yeni Satis', href: '/sales/new', icon: ShoppingCart, color: 'bg-emerald-500' },
              { label: 'Yeni Musteri', href: '/customers/new', icon: Users, color: 'bg-violet-500' },
              { label: 'Stok Girisi', href: '/stock/new', icon: Package, color: 'bg-amber-500' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
