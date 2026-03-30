import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'yellow' | 'purple'
  className?: string
}

export function Badge({ children, color = 'blue', className }: BadgeProps) {
  const colors = {
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red:    'bg-red-100 text-red-800',
    gray:   'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[color], className)}>
      {children}
    </span>
  )
}
