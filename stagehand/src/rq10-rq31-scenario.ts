import { z } from 'zod'
import { assertEquals } from './assert.js'
import { CLAVE, CUENTAS, levantarBackSimulado, type Cuenta } from './back-simulado.js'
import { frontUrl, type Provider } from './config.js'
import { guardarEvidencia } from './evidencia.js'
import { actuar, aparece, esperarRuta, esperarTexto, escribir, usosDeRespaldo } from './ia.js'
import { closeTestSession, createTestSession, type TestSession } from './stagehand.js'

const ETIQUETA: Record<string, string> = {
  estudiante: 'Estudiante',
  profesor: 'Docente',
  coordinador: 'Coordinador',
  decano: 'Decano',
  admin: 'Administrador',
}

async function pulsarTexto(session: TestSession, texto: string): Promise<void> {
  const hecho = await session.page.evaluate((buscado) => {
    const visible = (el: Element) => {
      const caja = el.getBoundingClientRect()
      return caja.width > 0 && caja.height > 0
    }
    const textoDe = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    const candidatos = Array.from(document.querySelectorAll('button, h3, span, a')).filter(visible)
    const nodo = candidatos.find((el) => textoDe(el) === buscado) ?? candidatos.find((el) => textoDe(el).includes(buscado))
    if (!(nodo instanceof HTMLElement)) return false
    nodo.click()
    return true
  }, texto)
  if (!hecho) throw new Error(`No se pudo pulsar «${texto}»`)
}

async function pulsarEnFila(session: TestSession, fila: string, boton: string): Promise<void> {
  const hecho = await session.page.evaluate(
    ({ fila, boton }) => {
      const tr = Array.from(document.querySelectorAll('tr')).find((el) => (el.textContent ?? '').includes(fila))
      const control = Array.from(tr?.querySelectorAll('button') ?? []).find((el) => (el.textContent ?? '').includes(boton))
      if (!(control instanceof HTMLElement)) return false
      control.click()
      return true
    },
    { fila, boton },
  )
  if (!hecho) throw new Error(`No está «${boton}» en la fila ${fila}`)
}

async function entrar(session: TestSession, cuenta: Cuenta): Promise<void> {
  await session.page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
  await esperarTexto(session, 'EntreAulas', 30_000)
  const etiqueta = ETIQUETA[cuenta.tipo_usuario] ?? cuenta.tipo_usuario
  if (etiqueta !== 'Estudiante') {
    await actuar(session, 'Encuentra el botón que abre el selector de tipo de usuario', {
      respaldoCss: 'form button[type="button"]',
    })
    await actuar(session, `Encuentra la opción ${etiqueta} en el selector de tipo de usuario`, {
      verificar: () => aparece(session, `Iniciar sesión como ${etiqueta}`, 8_000),
      respaldoCss: 'form .absolute button',
    })
    const rotulo = await session.page.locator('form button[type="submit"]').innerText()
    if (!rotulo.includes(etiqueta)) await pulsarTexto(session, etiqueta)
  }
  await escribir(session, 'el campo de correo institucional', cuenta.email, 'input[type="email"]')
  await escribir(session, 'el campo de contraseña', cuenta.password, 'input[type="password"]')
  await actuar(session, 'Encuentra el botón de enviar el inicio de sesión', {
    verificar: async () => (await esperarRuta(session, (ruta) => ruta !== '/login', 20_000).catch(() => '')) !== '',
    respaldoCss: 'form button[type="submit"]',
  })
}

async function estadistica(session: TestSession, titulo: string): Promise<string> {
  const extraido = await session.stagehand.extract(
    `Extrae el número que muestra la tarjeta "${titulo}"`,
    z.object({ valor: z.string() }),
    { page: session.page },
  )
  const numero = extraido.data.valor.match(/\d+/)?.[0]
  if (!numero) throw new Error(`RQ10: la tarjeta "${titulo}" no mostró un número (${extraido.data.valor})`)
  return numero
}

async function calificar(session: TestSession, comentario: string): Promise<void> {
  await pulsarTexto(session, 'Nueva Evaluación')
  await pulsarTexto(session, 'Ana Pérez')
  await session.page.locator('select').selectOption(['31'])
  await pulsarTexto(session, 'Grupo 1')
  await pulsarTexto(session, 'Continuar a Evaluación')
  await esperarTexto(session, 'Claridad Expositiva')
  await pulsarTexto(session, '5')
  await session.page.locator('textarea[placeholder="Escribe tus comentarios aquí..."]').fill(comentario)
  await pulsarTexto(session, 'Finalizar Evaluación')
  await pulsarTexto(session, 'Confirmar y Enviar')
}

/** RQ10, RQ11, RQ13, RQ29, RQ30 y RQ31 con observe → act y aserciones fijas. */
export async function runRq10Rq31(provider: Provider): Promise<void> {
  const back = await levantarBackSimulado()
  const session = await createTestSession(provider)
  try {
    await entrar(session, CUENTAS.estudiante)
    await esperarTexto(session, 'Evaluaciones Completadas')
    assertEquals(await estadistica(session, 'Evaluaciones Completadas'), '1', 'RQ10 Eva debe ver 1 completada')
    assertEquals(await estadistica(session, 'Evaluaciones Pendientes'), '0', 'RQ10 Eva debe ver 0 pendientes')
    assertEquals(await estadistica(session, 'Cursos Matriculados'), '1', 'RQ10 Eva debe ver 1 curso')

    await entrar(session, CUENTAS.lia)
    await esperarTexto(session, 'Evaluaciones Completadas')
    assertEquals(await estadistica(session, 'Evaluaciones Completadas'), '0', 'RQ10 Lía debe ver 0 completadas')

    await entrar(session, CUENTAS.estudiante)
    await actuar(session, 'Encuentra el botón Nueva Evaluación', {
      verificar: () => aparece(session, 'Ana Pérez', 15_000),
      respaldoCss: 'button:has-text("Nueva Evaluación")',
    })
    await calificar(session, 'La explicación fue clara')
    await esperarTexto(session, 'Gracias por tu participación')
    await esperarRuta(session, (ruta) => ruta === '/evaluate/goodbye')

    await entrar(session, CUENTAS.estudiante)
    await calificar(session, 'repetida')
    await esperarTexto(session, 'Ya has evaluado a este profesor para este curso y grupo')

    await entrar(session, CUENTAS.admin)
    await session.page.goto(`${frontUrl()}/admin/users`, { waitUntil: 'domcontentloaded' })
    await esperarTexto(session, CUENTAS.estudiante.email)
    await actuar(session, 'Encuentra el botón Agregar usuario', {
      verificar: () => aparece(session, 'Tipo de usuario'),
      respaldoCss: 'button:has-text("Agregar usuario")',
    })
    await escribir(session, 'el campo Nombre del formulario de alta', 'Luis', '#nombre')
    await escribir(session, 'el campo Apellido del formulario de alta', 'Gomez', '#apellido')
    await escribir(session, 'el campo Correo del formulario de alta', 'luis', '#correo-institucional')
    await escribir(session, 'el campo Contraseña del formulario de alta', CLAVE, '#contraseña')
    await actuar(session, 'Encuentra el botón Crear del formulario', {
      verificar: () => aparece(session, 'luis@soyudemedellin.edu.co', 15_000),
      respaldoCss: 'form button[type="submit"]',
    })
    await esperarTexto(session, 'LUIS GOMEZ')
    if ((await session.page.locator('body').innerText()).includes(CLAVE)) throw new Error('RQ13 mostró la contraseña')

    await pulsarTexto(session, 'Agregar usuario')
    await session.page.locator('#nombre').fill('Eva')
    await session.page.locator('#apellido').fill('Estudiante')
    await session.page.locator('#correo-institucional').fill('eva')
    await session.page.locator('#contraseña').fill(CLAVE)
    await pulsarTexto(session, 'Crear')
    await esperarTexto(session, 'El email ya está registrado')
    await session.page.locator('#contraseña').fill('cortacorta')
    await pulsarTexto(session, 'Crear')
    await esperarTexto(session, 'La contraseña debe contener al menos una letra mayúscula')
    await pulsarTexto(session, 'Cancelar')

    await pulsarEnFila(session, 'eva@soyudemedellin', 'Editar')
    await session.page.locator('#nombre').fill('Evelia')
    await pulsarTexto(session, 'Actualizar')
    await esperarTexto(session, 'EVELIA ESTUDIANTE')

    await pulsarEnFila(session, 'eva@soyudemedellin', 'Desactivar')
    await session.page.locator('.fixed.inset-0 button').nth(1).click()
    await esperarTexto(session, 'Inactivo')

    await pulsarEnFila(session, 'ada@udemedellin', 'Desactivar')
    await session.page.locator('.fixed.inset-0 button').nth(1).click()
    await esperarTexto(session, 'No puedes desactivar tu propia cuenta')

    await session.page.locator('input[placeholder="Buscar por nombre, email o rol…"]').fill('zzz')
    await esperarTexto(session, 'No hay usuarios que coincidan con los filtros')

    await entrar(session, CUENTAS.profesor)
    await session.page.goto(`${frontUrl()}/reports`, { waitUntil: 'domcontentloaded' })
    await actuar(session, 'Encuentra el botón Generar resumen IA', {
      verificar: () => aparece(session, 'Resumen de los comentarios del docente.', 20_000),
      respaldoCss: 'button:has-text("Generar resumen IA")',
    })
    await esperarTexto(session, 'claridad')
    if ((await session.page.locator('body').innerText()).includes('ALERTA DE ACOSO DETECTADO')) {
      throw new Error('RQ29 no debe mostrar la alerta de acoso')
    }

    await entrar(session, CUENTAS.coordinador)
    await session.page.goto(`${frontUrl()}/reports`, { waitUntil: 'domcontentloaded' })
    await pulsarTexto(session, 'Generar resumen IA')
    await esperarTexto(session, 'Resumen de la carrera.')
    await esperarTexto(session, 'ALERTA DE ACOSO DETECTADO')
    await esperarTexto(session, 'Hubo acoso en una respuesta.')
    await esperarTexto(session, 'Ana Perez: 1 mención(es)')

    await entrar(session, CUENTAS.decano)
    await session.page.goto(`${frontUrl()}/reports`, { waitUntil: 'domcontentloaded' })
    await pulsarTexto(session, 'Generar resumen IA')
    await esperarTexto(session, 'No se encontraron respuestas abiertas')
    await esperarTexto(session, 'No hay comentarios suficientes en la facultad.')

    await guardarEvidencia(session, `rq10-rq31-${provider}`, { respaldosDeterministicos: usosDeRespaldo, cuentas: back.cuentas.length })
    console.log(`[${provider}] RQ10 RQ11 RQ13 RQ29 RQ30 RQ31 superados`)
  } finally {
    await closeTestSession(session)
    await back.cerrar()
  }
}
