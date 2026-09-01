import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }

const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap',
  'whileFocus', 'whileInView', 'whileDrag', 'layout', 'layoutId', 'drag', 'onViewportEnter',
  'onViewportLeave', 'viewport',
])
function clean<T extends Record<string, unknown>>(props: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) if (!MOTION_PROPS.has(k)) out[k] = v
  return out as Partial<T>
}

const passthrough =
  (Tag: 'div' | 'header' | 'section' | 'span') =>
  ({ children, ...props }: DivProps) =>
    <Tag {...clean(props)}>{children}</Tag>

export const motion = {
  div: passthrough('div'),
  header: passthrough('header'),
  section: passthrough('section'),
  span: passthrough('span'),
  button: ({ children, ...props }: BtnProps) => <button {...clean(props)}>{children}</button>,
}

export const AnimatePresence = ({ children }: { children?: ReactNode }) => <>{children}</>
