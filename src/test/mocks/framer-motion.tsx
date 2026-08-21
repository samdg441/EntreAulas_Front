import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }

export const motion = {
  div: ({ children, ...props }: DivProps) => <div {...props}>{children}</div>,
  button: ({ children, ...props }: BtnProps) => <button {...props}>{children}</button>,
}

export const AnimatePresence = ({ children }: { children?: ReactNode }) => <>{children}</>
