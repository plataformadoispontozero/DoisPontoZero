import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-[#C74410]/15 text-[#FFAC8A] border border-[#C74410]/30',
        accent: 'bg-[#FF8759]/15 text-[#FF8759] border border-[#FF8759]/30',
        neutral: 'bg-[#1C1C24] text-[#B8B8C0] border border-[#30303B]',
        success: 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30',
        warning: 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30',
        error: 'bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30',
        info: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
        outline: 'bg-transparent text-[#B8B8C0] border border-[#30303B]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
