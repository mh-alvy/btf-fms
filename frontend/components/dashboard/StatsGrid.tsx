import { formatCurrency } from '@/lib/utils'
import { Users, BookOpen, DollarSign, AlertCircle } from 'lucide-react'

interface StatsGridProps {
  stats: {
    totalStudents: number
    totalBatches: number
    monthlyRevenue: number
    pendingFees: number
  }
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statItems = [
    {
      label: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Batches',
      value: stats.totalBatches.toString(),
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'This Month Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      label: 'Pending Fees',
      value: formatCurrency(stats.pendingFees),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={index} className="stat-card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}