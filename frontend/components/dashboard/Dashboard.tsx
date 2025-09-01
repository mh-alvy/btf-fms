'use client'

import { useEffect } from 'react'
import { useDataStore } from '@/lib/stores/data'
import { formatCurrency } from '@/lib/utils'
import StatsGrid from './StatsGrid'
import RecentActivities from './RecentActivities'

export default function Dashboard() {
  const { students, batches, payments, activities, fetchAll } = useDataStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const stats = {
    totalStudents: students.length,
    totalBatches: batches.length,
    monthlyRevenue: payments
      .filter(payment => {
        const paymentDate = new Date(payment.created_at)
        const now = new Date()
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, payment) => sum + payment.paid_amount, 0),
    pendingFees: payments.reduce((sum, payment) => sum + payment.due_amount, 0)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Break The Fear Fee Management System</p>
      </div>
      
      <StatsGrid stats={stats} />
      <RecentActivities activities={activities.slice(0, 10)} />
    </div>
  )
}