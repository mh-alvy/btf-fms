'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Database,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
  BookOpen
} from 'lucide-react'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'developer'] },
  { id: 'manage-batch', label: 'Manage Batch', icon: BookOpen, roles: ['admin', 'developer'] },
  { id: 'manage-students', label: 'Manage Students', icon: Users, roles: ['admin', 'manager', 'developer'] },
  { id: 'students-database', label: 'Students Database', icon: Database, roles: ['admin', 'manager', 'developer'] },
  { id: 'pay-fee', label: 'Pay Fee', icon: CreditCard, roles: ['admin', 'manager', 'developer'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'developer'] },
  { id: 'discount-reports', label: 'Discount Reports', icon: BarChart3, roles: ['admin', 'developer'] },
  { id: 'reference-management', label: 'Reference Management', icon: Settings, roles: ['developer'] },
  { id: 'user-management', label: 'User Management', icon: UserCog, roles: ['developer'] },
]

interface NavigationProps {
  currentPage?: string
  onPageChange?: (page: string) => void
}

export default function Navigation({ currentPage = 'dashboard', onPageChange }: NavigationProps) {
  const { user } = useAuthStore()
  const [activePage, setActivePage] = useState(currentPage)

  const handlePageChange = (pageId: string) => {
    setActivePage(pageId)
    onPageChange?.(pageId)
  }

  const hasPermission = (requiredRoles: string[]) => {
    return user && requiredRoles.includes(user.role)
  }

  const visibleItems = navigationItems.filter(item => hasPermission(item.roles))

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary-500 text-white border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                )}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}