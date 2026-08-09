import { cn } from '@/lib/utils'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ enabled, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-escriba-500/20',
          enabled ? 'bg-escriba-600' : 'bg-neutral-200 dark:bg-neutral-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>}
    </label>
  )
}
