import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-gray-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300',
            leftIcon   && 'pl-10',
            rightElement && 'pr-10',
            className
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3">{rightElement}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={taId} className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={taId}
        rows={3}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
