/**
 * Preferencias de visualización: modo noche, idioma y tamaño de texto (accesibilidad).
 * Mock: ninguno. Se usa el proveedor real sobre jsdom; el almacenamiento es el Fake de setup.ts.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PreferenciasMenu from '../../components/PreferenciasMenu'
import { usePreferencias } from '../../preferencias/PreferenciasContext'
import { CLAVE_PREFERENCIAS } from '../../preferencias/preferencias'
import { renderConPreferencias, simularMatchMedia } from '../helpers/render-rediseno'

function Saludo() {
  const { t } = usePreferencias()
  return <p>{t('nav.inicio')}</p>
}

const abrirPanel = async () => {
  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('button', { name: 'Preferencias de visualización' }))
  return usuario
}

describe('PreferenciasMenu', () => {
  beforeEach(() => {
    simularMatchMedia(false)
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-text-size')
    document.documentElement.lang = 'es'
  })

  it('abre un panel con tres grupos de opciones y el botón informa que está expandido', async () => {
    renderConPreferencias(<PreferenciasMenu />)

    await abrirPanel()

    expect(screen.getByRole('dialog', { name: 'Preferencias de visualización' })).toBeInTheDocument()
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Preferencias de visualización' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('elegir "Noche" activa la clase dark y se recuerda al recargar', async () => {
    renderConPreferencias(<PreferenciasMenu />)
    const usuario = await abrirPanel()

    await usuario.click(screen.getByRole('radio', { name: 'Noche' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('radio', { name: 'Noche' })).toBeChecked()
    expect(JSON.parse(window.localStorage.getItem(CLAVE_PREFERENCIAS)!)).toMatchObject({ tema: 'oscuro' })
  })

  it('elegir "Inglés" traduce los textos y actualiza el atributo lang', async () => {
    renderConPreferencias(
      <>
        <PreferenciasMenu />
        <Saludo />
      </>
    )
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    const usuario = await abrirPanel()

    await usuario.click(screen.getByRole('radio', { name: 'Inglés' }))

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('button', { name: 'Display preferences' })).toBeInTheDocument()
  })

  it.each([
    ['Pequeño', 'small'],
    ['Grande', 'large'],
    ['Muy grande', 'xlarge'],
  ])('el tamaño "%s" fija data-text-size="%s" y "Estándar" lo quita', async (nombre, valor) => {
    renderConPreferencias(<PreferenciasMenu />)
    const usuario = await abrirPanel()

    await usuario.click(screen.getByRole('radio', { name: nombre }))
    expect(document.documentElement.getAttribute('data-text-size')).toBe(valor)

    await usuario.click(screen.getByRole('radio', { name: 'Estándar' }))
    expect(document.documentElement.hasAttribute('data-text-size')).toBe(false)
  })

  it('"Automático" sigue la preferencia del sistema operativo', async () => {
    simularMatchMedia(true)
    renderConPreferencias(<PreferenciasMenu />)

    expect(document.documentElement).toHaveClass('dark')
  })

  it('Escape cierra el panel y devuelve el foco al botón', async () => {
    renderConPreferencias(<PreferenciasMenu />)
    const usuario = await abrirPanel()

    await usuario.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preferencias de visualización' })).toHaveFocus()
  })

  it('con preferencias guardadas arranca con ellas (idioma y tema)', () => {
    window.localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify({ tema: 'oscuro', idioma: 'en', tamano: 'large' }))

    renderConPreferencias(<Saludo />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.getAttribute('data-text-size')).toBe('large')
  })
})
