import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }

const passthrough =
  (Tag: 'div' | 'header' | 'section' | 'span') =>
  ({ children, ...props }: DivProps) =>
    <Tag {...props}>{children}</Tag>

export const motion = {
  div: passthrough('div'),
  header: passthrough('header'),
  section: passthrough('section'),
  span: passthrough('span'),
  button: ({ children, ...props }: BtnProps) => <button {...props}>{children}</button>,
}

export const AnimatePresence = ({ children }: { children?: ReactNode }) => <>{children}</>
