import React from 'react'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl'
}

export function PageWrapper({ 
  children, 
  title, 
  subtitle, 
  icon,
  maxWidth = 'max-w-7xl'
}: PageWrapperProps) {
  return (
    <main className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-4 md:p-6 lg:p-12" 
      style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)' }}>
      <div className={`${maxWidth} mx-auto w-full`}>
        {(title || subtitle) && (
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-4">
              {icon && <div className="flex-shrink-0">{icon}</div>}
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold" 
                    style={{ color: '#003d99' }}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm md:text-base mt-2 font-medium" 
                    style={{ color: '#6b7280' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </main>
  )
}
