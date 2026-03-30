import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm p-4', className)} {...props}>
      {children}
    </div>
  )
}
