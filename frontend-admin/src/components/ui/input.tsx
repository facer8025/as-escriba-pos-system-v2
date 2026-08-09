import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
}

export function Input({ label, error, helperText, leftIcon, className, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'w-full h-11 rounded-xl border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-escriba-500/20 focus:border-escriba-500',
            'transition-all text-sm',
            leftIcon ? 'pl-10' : 'pl-4',
            'pr-4',
            error ? 'border-danger-500' : 'border-neutral-200 dark:border-neutral-700',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-neutral-400">{helperText}</p>}
    </div>
  )
}
