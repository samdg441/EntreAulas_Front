/**
 * DEF-FE-12 — Alta de usuario (RQ1): escribir el correo completo deja el dominio pegado al usuario
 *
 * Severidad: Media | Estado: CORREGIDO (2026-10-26, siguienteUsuarioCorreo). Encontrado con Cypress (e2e/cypress/e2e/ui/rq1-registro-admin.cy.ts).
 *
 * El campo «Correo» del alta aplica usuarioDeCorreo() en cada pulsación. Al teclear «carla.ruiz@gmail.com»:
 * con la «@» el valor se recorta a «carla.ruiz», pero las teclas siguientes ya no traen «@» y se agregan
 * al usuario: el correo final es «carla.ruizgmail.com@soyudemedellin.edu.co». Pegar el texto sí funciona,
 * por eso las pruebas unitarias (que pasan el valor completo) no lo detectaban.
 */
import { describe, expect, it } from 'vitest'
import * as gestion from '../../features/dashboard-admin/gestionar-usuarios'

type Estado = { valor: string; descartandoDominio: boolean }
type Siguiente = (estado: Estado, escrito: string) => Estado

/** Simula el onChange del input: cada tecla se agrega al valor que muestra el campo. */
function teclear(texto: string) {
  const siguiente = (gestion as unknown as { siguienteUsuarioCorreo?: Siguiente }).siguienteUsuarioCorreo
  expect(siguiente, 'falta un normalizador que recuerde que se está escribiendo el dominio').toBeTypeOf('function')
  let estado: Estado = { valor: '', descartandoDominio: false }
  for (const tecla of texto) estado = siguiente!(estado, estado.valor + tecla)
  return estado.valor
}

describe('DEF-FE-12 — El usuario del correo no absorbe el dominio tecleado', () => {
  it('teclear «carla.ruiz@gmail.com» deja solo «carla.ruiz»', () => {
    expect(teclear('carla.ruiz@gmail.com')).toBe('carla.ruiz')
  })

  it('pegar el correo completo sigue dejando solo el usuario', () => {
    expect(gestion.usuarioDeCorreo('Carla.Ruiz@gmail.com')).toBe('carla.ruiz')
  })
})
