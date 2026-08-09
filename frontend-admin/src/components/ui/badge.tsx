import { cn } from '@/lib/utils'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

const badgeVariants = {
  default: 'bg-escriba-50 text-escriba-700 dark:bg-escriba-900/20 dark:text-escriba-400',
  success: 'bg-success-50 text-success-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-danger-50 text-danger-600 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-info-50 text-info-600 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium', badgeVariants[variant], className)}>
      {children}
    </span>
  )
}

// Status badge for tenant/license/etc statuses
const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  ACTIVE: 'success',
  TRIAL: 'warning',
  SUSPENDED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'danger',
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  CLOSED: 'neutral',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge variant={statusMap[status] ?? 'neutral'}>
      {label ?? status}
    </Badge>
  )
}
