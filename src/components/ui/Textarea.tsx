import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-[#30303B] bg-[#1C1C24] px-3 py-2 text-xs text-[#F8F9FC] placeholder-[#717182] transition-colors focus-visible:outline-none focus-visible:border-[#7952FF] focus-visible:ring-1 focus-visible:ring-[#7952FF] disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          error && 'border-[#FB7185] focus-visible:border-[#FB7185] focus-visible:ring-[#FB7185]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
