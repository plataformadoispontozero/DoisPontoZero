import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options?: SelectOption[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, options, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <select
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border border-[#30303B] bg-[#1C1C24] px-3 py-1.5 pr-8 text-xs text-[#F8F9FC] transition-colors focus-visible:outline-none focus-visible:border-[#C74410] focus-visible:ring-1 focus-visible:ring-[#C74410] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            error && 'border-[#FB7185] focus-visible:border-[#FB7185]',
            className
          )}
          ref={ref}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-[#B8B8C0] absolute right-2.5 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = 'Select'
