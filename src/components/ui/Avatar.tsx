import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'busy' | 'away' | 'offline'
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', status, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    const sizeClasses = {
      sm: 'w-7 h-7 text-[10px]',
      md: 'w-9 h-9 text-xs',
      lg: 'w-11 h-11 text-sm',
      xl: 'w-14 h-14 text-base font-bold',
    }

    const statusSizes = {
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-3.5 h-3.5',
    }

    const statusColors = {
      online: 'bg-[#34D399]',
      busy: 'bg-[#FB7185]',
      away: 'bg-[#FBBF24]',
      offline: 'bg-[#98989F]',
    }

    const getInitials = (str: string) => {
      const parts = str.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return str.slice(0, 2).toUpperCase()
    }

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0 select-none', className)}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-[#252530] border border-[#30303B] text-[#F8F9FC] font-medium overflow-hidden',
            sizeClasses[size]
          )}
        >
          {src && !imageError ? (
            <img
              src={src}
              alt={alt || name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-[#101014]',
              statusSizes[size],
              statusColors[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'
