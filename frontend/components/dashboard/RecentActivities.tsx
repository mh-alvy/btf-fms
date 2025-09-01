import { getRelativeTime } from '@/lib/utils'

interface Activity {
  id: string
  type: string
  description: string
  user_id: string
  created_at: string
}

interface RecentActivitiesProps {
  activities: Activity[]
}

const getActivityIcon = (type: string) => {
  const iconMap: { [key: string]: string } = {
    'batch_created': '📚',
    'batch_updated': '✏️',
    'batch_deleted': '🗑️',
    'course_created': '📖',
    'course_updated': '✏️',
    'course_deleted': '🗑️',
    'month_created': '📅',
    'month_updated': '✏️',
    'month_deleted': '🗑️',
    'institution_created': '🏫',
    'institution_updated': '✏️',
    'institution_deleted': '🗑️',
    'student_added': '👤',
    'student_updated': '✏️',
    'student_deleted': '🗑️',
    'payment_received': '💰'
  }
  return iconMap[type] || '📄'
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      
      {activities.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No recent activities</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{getRelativeTime(activity.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}