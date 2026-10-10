import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  'aria-label': string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 p-0 rounded-lg',
      md: 'h-9 w-9 p-0 rounded-lg',
      lg: 'h-10 w-10 p-0 rounded-xl',
    }

    return (
      <Button
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    )
  }
)
IconButton.displayName = 'IconButton'
