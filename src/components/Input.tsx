import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input
        className={`w-full px-4 py-2 border border-border rounded-lg bg-input-background outline-none transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}