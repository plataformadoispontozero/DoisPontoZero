import { OfficialBrandLogo } from './OfficialBrandLogo'
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
  return <span className={cn('inline-block shrink-0 overflow-hidden',className)} style={{width:size,height:size}} aria-hidden="true"><img src="/agency/official-logo.webp" alt="" style={{height:size,width:size*275/39,maxWidth:'none'}} /></span>

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

  if (!collapsed && branding.name.toLowerCase().replace(/[^a-z]/g, '') === 'doiszero') {
    return <div className={cn('select-none', className)}><OfficialBrandLogo src="/agency/official-logo.webp" name={branding.name} />{showSlogan && <p className="text-xs text-[#B8B8C0] mt-2">{branding.slogan}</p>}</div>
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
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#C74410]/20 text-[#FFAC8A] border border-[#C74410]/30">
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
