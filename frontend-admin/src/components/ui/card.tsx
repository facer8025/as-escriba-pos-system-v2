import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6',
        hover && 'hover:shadow-lg transition-shadow',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardContent({ children, className }: CardProps) {
  return <div className={className}>{children}</div>
}

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: number
  className?: string
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{value}</p>
          {trend !== undefined && (
            <p className={cn('text-xs mt-1', trend >= 0 ? 'text-success-600' : 'text-danger-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-escriba-50 dark:bg-escriba-900/20 flex items-center justify-center text-escriba-600 dark:text-escriba-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
