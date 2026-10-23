import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--color-on-primary,#fff)] hover:bg-[var(--color-primary-hover)] active:brightness-90 shadow-sm',
        accent:
          'bg-[var(--color-accent)] text-[var(--color-on-accent,#101014)] font-semibold hover:bg-[var(--color-accent-hover)] active:brightness-90',
        secondary:
          'bg-[#1C1C24] text-[#F8F9FC] border border-[#30303B] hover:bg-[#252530] hover:border-[#424252]',
        ghost:
          'text-[#B8B8C0] hover:text-[#F8F9FC] hover:bg-[#1C1C24]',
        outline:
          'border border-[#30303B] text-[#F8F9FC] hover:bg-[#1C1C24] hover:border-[#424252]',
        danger:
          'bg-rose-500/15 text-[#FB7185] border border-rose-500/30 hover:bg-rose-500/25',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9 p-0',
        iconSm: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
