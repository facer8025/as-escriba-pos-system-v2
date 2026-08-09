import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
          'focus:outline-none focus:ring-2 focus:ring-escriba-500/20 focus:border-escriba-500',
          'transition-all text-sm appearance-none',
          error ? 'border-danger-500' : 'border-neutral-200 dark:border-neutral-700',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  )
}
