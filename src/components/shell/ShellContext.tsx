import { createContext, useContext } from 'react'

/** Lo que el Header necesita saber del AppShell: si existe y cómo abrir el menú en móvil. */
export interface ShellContexto {
  dentroDelShell: boolean
  abrirMenu: () => void
}

export const ShellCtx = createContext<ShellContexto>({ dentroDelShell: false, abrirMenu: () => {} })
export const useShell = () => useContext(ShellCtx)
