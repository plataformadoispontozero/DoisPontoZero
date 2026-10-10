import React from 'react'
import { useBranding } from '@/hooks/useBranding'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  collapsed?: boolean
  showSlogan?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const BrandSymbol: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="9" fill="#1C1C24" />
      <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="#282834" />
      {/* Círculo 1 com gradiente Primary */}
      <circle cx="13" cy="18" r="6" stroke="#7952FF" strokeWidth="2.5" />
      {/* Círculo 2 com Accent */}
      <circle cx="23" cy="18" r="6" stroke="#B8FF65" strokeWidth="2.5" />
      {/* Ponto de convergência central */}
      <circle cx="18" cy="18" r="2" fill="#F8F9FC" />
    </svg>
  )
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  showSlogan = false,
  className,
  size = 'md',
}) => {
  const { branding } = useBranding()

  const symbolSizes = {
    sm: 26,
    md: 32,
    lg: 40,
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <BrandSymbol size={symbolSizes[size]} />
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-heading font-bold text-base tracking-tight text-[#F8F9FC] truncate">
              {branding.name}
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#7952FF]/20 text-[#B89EFF] border border-[#7952FF]/30">
              OS
            </span>
          </div>
          {showSlogan && (
            <span className="text-[11px] text-[#AEB2C2] mt-0.5 truncate">
              {branding.slogan}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
