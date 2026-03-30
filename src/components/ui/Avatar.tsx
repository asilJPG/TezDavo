import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

interface AvatarProps {
  name: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={cn('rounded-full object-cover bg-gray-200', sizes[size])} />
  }
  return (
    <div className={cn('rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0', sizes[size])}>
      {getInitials(name)}
    </div>
  )
}
