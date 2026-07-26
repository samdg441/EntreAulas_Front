// components/Button.tsx
import { motion } from 'framer-motion'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function Button({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default',
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    default: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-white bg-opacity-90 text-gray-900 hover:bg-gray-100 shadow-md',
    ghost: 'bg-white bg-opacity-90 text-gray-900 hover:bg-gray-100 shadow-md',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  }
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}