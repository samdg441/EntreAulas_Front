import { InputHTMLAttributes, ReactNode } from 'react'
import { FaExclamationCircle } from 'react-icons/fa'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
  showErrorIcon?: boolean
}

export default function Input({
  label,
  error,
  leftIcon,
  rightElement,
  showErrorIcon = true,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')
  const hasLeft = Boolean(leftIcon)
  const hasRight = Boolean(rightElement) || Boolean(error && showErrorIcon)

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={[
            'w-full py-2 border rounded-lg bg-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm',
            hasLeft ? 'pl-10' : 'pl-3',
            hasRight ? 'pr-10' : 'pr-3',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300',
            props.disabled ? 'bg-gray-50 text-gray-600' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightElement ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</div>
        ) : (
          error &&
          showErrorIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FaExclamationCircle className="h-4 w-4 text-red-500" />
            </div>
          )
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          <FaExclamationCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
