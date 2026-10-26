import 'dotenv/config'
import { z } from 'zod'
import { assertEquals } from '../src/assert.js'
import { CLAVE, CUENTAS, levantarBackSimulado } from '../src/back-simulado.js'
import { frontUrl, selectedProvider } from '../src/config.js'
import { guardarEvidencia } from '../src/evidencia.js'
import { actuar, aparece, elegir, esperarTexto, llenar, observar, usosDeRespaldo } from '../src/ia.js'
import { run } from '../src/run.js'
import { closeTestSession, createTestSession } from '../src/stagehand.js'

/**
 * RQ1 — Alta de usuarios desde admin con Stagehand + IA.
 * observe reconoce los campos del formulario, act los llena (con variables para no exponer la clave en el prompt)
 * y extract lee la tabla; el back simulado confirma qué payload llegó.
 */
async function main(): Promise<void> {
  const provider = selectedProvider()
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)
  const usuario = `sh.${Date.now()}`
  const correo = `${usuario}@soyudemedellin.edu.co`

  try {
    await session.page.addInitScript((u) => {
      localStorage.setItem('token', `jwt-${u.email}`)
      localStorage.setItem('user', JSON.stringify({ id: 'u-admin', ...u, password: undefined, roles: ['admin'] }))
    }, CUENTAS.admin)
    await session.page.goto(`${frontUrl()}/admin/users`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, 'Usuarios del sistema', 30_000)

    // En el encabezado también hay botones: se acota al contenido principal y se verifica que abrió el formulario.
    await actuar(session, 'Encuentra el elemento button cuyo texto es exactamente "Agregar usuario"', {
      verificar: () => aparece(session, 'Tipo de usuario'),
      alternativas: ['Encuentra el botón que abre el formulario para agregar un usuario nuevo (no el título)'],
      respaldoCss: 'main button:has(svg.lucide-plus), main button',
    })

    const campos = await observar(session, 'Encuentra los campos del formulario para agregar un usuario: nombre, apellido, correo, contraseña y tipo de usuario', 4)

    // Las acciones del observe anterior ya apuntan a los <input>: un observe por campo devolvía a veces el <div> contenedor.
    await llenar(session, elegir(campos, /nombre/i), 'el campo de texto Nombre', 'stagehand', '#nombre')
    await llenar(session, elegir(campos, /apellido/i), 'el campo de texto Apellido', 'prueba', '#apellido')
    // El input del correo va pegado al sufijo del dominio: el modelo a veces apunta al contenedor.
    await llenar(session, elegir(campos, /correo/i), 'el campo de texto Correo con placeholder "usuario"', usuario, '#correo-institucional')
    await llenar(session, elegir(campos, /contrase/i), 'el campo de texto Contraseña', CLAVE, '#contraseña')
    await actuar(session, 'Encuentra el botón de envío "Crear" del formulario Agregar usuario', {
      verificar: () => aparece(session, correo, 15_000),
      respaldoCss: 'form button[type="submit"]',
    })
    await esperarTexto(session, correo, 30_000)

    const tabla = await session.stagehand.extract(
      'Extrae los correos de todos los usuarios que aparecen en la tabla de usuarios del sistema',
      z.object({ correos: z.array(z.string()).min(1) }),
      { page: session.page, locator: session.page.locator('table') }
    )
    if (!tabla.data.correos.some((c) => c.toLowerCase().includes(usuario))) {
      throw new Error(`extract no encontró ${correo} en la tabla: ${tabla.data.correos.join(', ')}`)
    }

    const creada = back.cuentas.find((c) => c.email === correo)
    if (!creada) throw new Error('El back no recibió el alta.')
    assertEquals(creada.nombre, 'STAGEHAND', 'El nombre debe enviarse en mayúsculas.')
    assertEquals(creada.tipo_usuario, 'estudiante', 'El tipo por defecto debe ser estudiante.')

    await guardarEvidencia(session, `rq1-crear-usuario-${provider}`, {
      campos,
      extraido: tabla.data,
      enviadoAlBack: { ...creada, password: '***' },
      respaldosDeterministicos: usosDeRespaldo,
    })
    console.log(`[${provider}] RQ1 superada: ${correo} creado y visible en la tabla`)
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}

run(main)
