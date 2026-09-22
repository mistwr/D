import Image from 'next/image'

type LuminBrandProps = {
  compact?: boolean
  inverse?: boolean
  showPartner?: boolean
  className?: string
}

export function LuminBrand({
  compact = false,
  inverse = false,
  showPartner = true,
  className = '',
}: LuminBrandProps) {
  const titleColor = inverse ? '#ffffff' : '#111827'
  const mutedColor = inverse ? 'rgba(255,255,255,0.58)' : '#6b7280'

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} ${className}`}>
      <Image
        src="/lumin-ai-icon.svg"
        alt="Lumin AI"
        width={compact ? 34 : 48}
        height={compact ? 34 : 48}
        className={`${compact ? 'h-9 w-9' : 'h-12 w-12'} rounded-xl shadow-lg`}
        priority
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className={`${compact ? 'text-sm' : 'text-base'} font-black tracking-[0.12em]`} style={{ color: titleColor }}>
            LUMIN
          </span>
          <span className={`${compact ? 'text-sm' : 'text-base'} font-black tracking-[0.12em]`} style={{ color: '#e7b95f' }}>
            AI
          </span>
        </div>
        {showPartner && (
          <p className={`${compact ? 'text-[10px]' : 'text-xs'} truncate`} style={{ color: mutedColor }}>
            CRM · Soluções Diferentes
          </p>
        )}
      </div>
    </div>
  )
}
