import { assertEquals, assertIncludes } from './assert.js'
import type { TestSession } from './stagehand.js'

/** Inicia sesión con act (IA). La ruta final se valida de forma determinística. */
export async function iniciarSesionConAct(
  session: TestSession,
  datos: { tipo: string; email: string; password: string; dashboard: string }
): Promise<string> {
  await session.stagehand.act('Abre el selector de Tipo de Usuario y elige la opción %tipo%', {
    page: session.page,
    variables: { tipo: datos.tipo },
  })
  await session.stagehand.act('Escribe %correo% en el campo de correo institucional o email', {
    page: session.page,
    variables: { correo: datos.email },
  })
  await session.stagehand.act('Escribe %clave% en el campo de contraseña', {
    page: session.page,
    variables: { clave: datos.password },
  })
  await session.stagehand.act('Haz clic en el botón rojo para iniciar sesión', {
    page: session.page,
  })

  await session.page.waitForFunction(
    () => !window.location.pathname.includes('/login'),
    undefined,
    { timeout: 60_000 }
  )
  const ruta = new URL(await session.page.url()).pathname
  assertEquals(ruta, datos.dashboard, 'Tras el login no se llegó al panel esperado.')
  assertIncludes(ruta, 'dashboard', 'La ruta no parece un dashboard.')
  return ruta
}
