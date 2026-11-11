import { useEffect, useId, useRef, useState } from 'react'
import { Monitor, Moon, SlidersHorizontal, Sun } from 'lucide-react'
import { usePreferencias } from '../preferencias/PreferenciasContext'
import { IDIOMAS, TAMANOS, TEMAS, type Idioma, type TamanoTexto, type Tema } from '../preferencias/preferencias'
import type { Clave } from '../i18n/diccionario'

const ICONO_TEMA = { claro: Sun, oscuro: Moon, sistema: Monitor } as const

interface OpcionProps<T extends string> {
  valor: T
  activo: boolean
  etiqueta: string
  onElegir: (v: T) => void
  icono?: React.ReactNode
}

function Opcion<T extends string>({ valor, activo, etiqueta, onElegir, icono }: Readonly<OpcionProps<T>>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={() => onElegir(valor)}
      className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-small font-medium transition-colors ${
        activo ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icono}
      {etiqueta}
    </button>
  )
}

function Grupo({ titulo, id, children }: Readonly<{ titulo: string; id: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <p id={id} className="text-small font-semibold text-gray-900">
        {titulo}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {children}
      </div>
    </div>
  )
}

/** Botón de la barra superior que abre el panel de tema, idioma y tamaño de texto. */
export default function PreferenciasMenu({ className = '' }: Readonly<{ className?: string }>) {
  const { tema, idioma, tamano, setTema, setIdioma, setTamano, t } = usePreferencias()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const uid = useId()

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    const alHacerClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('keydown', alPulsar)
    document.addEventListener('mousedown', alHacerClic)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.removeEventListener('mousedown', alHacerClic)
    }
  }, [abierto])

  return (
    <div ref={contenedor} className={`relative ${className}`}>
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={t('pref.abrir')}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={abierto ? `${uid}-panel` : undefined}
        title={t('pref.abrir')}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100"
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          id={`${uid}-panel`}
          role="dialog"
          aria-label={t('pref.titulo')}
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
        >
          <h2 className="text-subtitle font-semibold text-gray-900">{t('pref.titulo')}</h2>

          <Grupo titulo={t('pref.apariencia')} id={`${uid}-tema`}>
            {TEMAS.map((v: Tema) => {
              const Icono = ICONO_TEMA[v]
              return (
                <Opcion
                  key={v}
                  valor={v}
                  activo={tema === v}
                  etiqueta={t(`pref.${v === 'oscuro' ? 'oscuro' : v}` as Clave)}
                  onElegir={setTema}
                  icono={<Icono className="h-4 w-4" aria-hidden="true" />}
                />
              )
            })}
          </Grupo>

          <Grupo titulo={t('pref.idioma')} id={`${uid}-idioma`}>
            {IDIOMAS.map((v: Idioma) => (
              <Opcion key={v} valor={v} activo={idioma === v} etiqueta={t(`pref.${v}` as Clave)} onElegir={setIdioma} />
            ))}
          </Grupo>

          <Grupo titulo={t('pref.tamano')} id={`${uid}-tamano`}>
            {TAMANOS.map((v: TamanoTexto) => (
              <Opcion key={v} valor={v} activo={tamano === v} etiqueta={t(`pref.${v}` as Clave)} onElegir={setTamano} />
            ))}
          </Grupo>

          <p className="text-small text-gray-500">{t('pref.ayuda')}</p>
        </div>
      )}
    </div>
  )
}
