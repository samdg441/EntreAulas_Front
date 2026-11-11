import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { traducir, type Clave } from '../i18n/diccionario'
import {
  PREFERENCIAS_POR_DEFECTO,
  aplicarPreferencias,
  esTemaOscuro,
  guardarPreferencias,
  leerPreferencias,
  type Idioma,
  type Preferencias,
  type TamanoTexto,
  type Tema,
} from './preferencias'

export interface PreferenciasContexto extends Preferencias {
  /** Tema realmente aplicado (resuelve «automático» según el sistema). */
  oscuro: boolean
  /** Código para `toLocaleDateString` y similares. */
  locale: 'es-CO' | 'en-US'
  setTema: (tema: Tema) => void
  setIdioma: (idioma: Idioma) => void
  setTamano: (tamano: TamanoTexto) => void
  t: (clave: Clave, valores?: Record<string, string | number>) => string
}

const porDefecto: PreferenciasContexto = {
  ...PREFERENCIAS_POR_DEFECTO,
  oscuro: false,
  locale: 'es-CO',
  setTema: () => {},
  setIdioma: () => {},
  setTamano: () => {},
  t: (clave, valores) => traducir('es', clave, valores),
}

const Contexto = createContext<PreferenciasContexto>(porDefecto)

const consultaOscuro = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

export function PreferenciasProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [prefs, setPrefs] = useState<Preferencias>(() => leerPreferencias())
  const [sistemaOscuro, setSistemaOscuro] = useState(() => Boolean(consultaOscuro()?.matches))

  useEffect(() => {
    const consulta = consultaOscuro()
    if (!consulta?.addEventListener) return
    const alCambiar = (e: MediaQueryListEvent) => setSistemaOscuro(e.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  useEffect(() => {
    aplicarPreferencias(prefs, sistemaOscuro)
  }, [prefs, sistemaOscuro])

  const actualizar = useCallback((parcial: Partial<Preferencias>) => {
    setPrefs((actual) => {
      const siguiente = { ...actual, ...parcial }
      guardarPreferencias(siguiente)
      return siguiente
    })
  }, [])

  const valor = useMemo<PreferenciasContexto>(
    () => ({
      ...prefs,
      oscuro: esTemaOscuro(prefs.tema, sistemaOscuro),
      locale: prefs.idioma === 'en' ? 'en-US' : 'es-CO',
      setTema: (tema) => actualizar({ tema }),
      setIdioma: (idioma) => actualizar({ idioma }),
      setTamano: (tamano) => actualizar({ tamano }),
      t: (clave, valores) => traducir(prefs.idioma, clave, valores),
    }),
    [prefs, sistemaOscuro, actualizar]
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** Sin proveedor devuelve español y tema claro, así los componentes se pueden probar aislados. */
export function usePreferencias(): PreferenciasContexto {
  return useContext(Contexto)
}
