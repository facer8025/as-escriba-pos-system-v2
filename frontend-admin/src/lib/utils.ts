import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return formatDate(date)
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)
}

/** Obtener badge class para rol admin */
export function getAdminRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    SA: 'admin-badge-sa',
    AC: 'admin-badge-ac',
    AF: 'admin-badge-af',
    ST: 'admin-badge-st',
    AU: 'admin-badge-au',
  }
  return map[role] ?? 'bg-neutral-100 text-neutral-700'
}

/** Nombre legible del rol admin */
export function getAdminRoleName(role: string): string {
  const map: Record<string, string> = {
    SA: 'Super Admin',
    AC: 'Admin Comercial',
    AF: 'Admin Financiero',
    ST: 'Soporte Técnico',
    AU: 'Auditor',
  }
  return map[role] ?? role
}

/** Obtener color para semáforo de estado de empresa */
export function getTenantStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-success-500',
    TRIAL: 'bg-warning-500',
    SUSPENDED: 'bg-danger-500',
    CANCELLED: 'bg-neutral-400',
  }
  return map[status] ?? 'bg-neutral-400'
}

/** Badge de estado de empresa */
export function getTenantStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-success-50 text-success-600 dark:bg-green-900/30 dark:text-green-400',
    TRIAL: 'bg-warning-50 text-warning-600 dark:bg-amber-900/30 dark:text-amber-400',
    SUSPENDED: 'bg-danger-50 text-danger-600 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  }
  return map[status] ?? 'bg-neutral-100 text-neutral-500'
}
