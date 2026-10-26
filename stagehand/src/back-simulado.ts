import { createServer, type IncomingMessage, type Server } from 'node:http'

/**
 * Back de autenticación en memoria para Stagehand (RQ1–RQ5): mismas reglas que el back real.
 * El front local usa http://localhost:3000 cuando no hay VITE_API_URL, así que el servidor escucha ahí.
 * Así las pruebas no necesitan cuentas reales ni tocan la base de datos de producción.
 */
export type Cuenta = { email: string; password: string; nombre: string; apellido: string; tipo_usuario: string; activo?: boolean }
type Token = { token: string; email: string; usado: boolean }

export const CLAVE = 'Clave#2026a'
export const MENSAJE_GENERICO = 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace de recuperación'
export const CUENTAS = {
  admin: { email: 'ada@udemedellin.edu.co', password: CLAVE, nombre: 'ADA', apellido: 'ADMIN', tipo_usuario: 'admin' },
  estudiante: { email: 'eva@soyudemedellin.edu.co', password: CLAVE, nombre: 'EVA', apellido: 'ESTUDIANTE', tipo_usuario: 'estudiante' },
  profesor: { email: 'pablo@udemedellin.edu.co', password: CLAVE, nombre: 'PABLO', apellido: 'PROFESOR', tipo_usuario: 'profesor' },
} satisfies Record<string, Cuenta>

export type BackSimulado = {
  cuentas: Cuenta[]
  tokens: Token[]
  correos: Array<{ para: string; enlace: string }>
  cerrar(): Promise<void>
}

const leerCuerpo = async (req: IncomingMessage): Promise<Record<string, string>> => {
  let texto = ''
  for await (const parte of req) texto += parte
  try {
    return texto ? JSON.parse(texto) : {}
  } catch {
    return {}
  }
}

export async function levantarBackSimulado(puerto = Number(process.env.BACK_SIMULADO_PUERTO ?? 3000)): Promise<BackSimulado> {
  const cuentas: Cuenta[] = Object.values(CUENTAS).map((c) => ({ ...c }))
  const tokens: Token[] = []
  const correos: BackSimulado['correos'] = []

  const servidor: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${puerto}`)
    const responder = (estado: number, cuerpo: unknown) => {
      res.writeHead(estado, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': req.headers.origin ?? '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      })
      res.end(JSON.stringify(cuerpo))
    }
    if (req.method === 'OPTIONS') return responder(204, {})
    const cuerpo = await leerCuerpo(req)
    const ruta = url.pathname

    if (req.method === 'POST' && ruta === '/api/auth/login') {
      const c = cuentas.find((x) => x.email === cuerpo.email && x.password === cuerpo.password && x.activo !== false)
      if (!c) return responder(401, { error: 'Credenciales inválidas' })
      return responder(200, { token: `jwt-${c.email}`, user: { id: 'u-1', ...c, password: undefined, roles: [c.tipo_usuario] } })
    }
    if (req.method === 'POST' && ruta === '/api/auth/create-user') {
      if (cuentas.some((x) => x.email === cuerpo.email)) return responder(400, { error: 'El email ya está registrado' })
      cuentas.push(cuerpo as unknown as Cuenta)
      return responder(201, { message: 'Usuario creado', user: { id: `u-${cuentas.length}` } })
    }
    if (req.method === 'GET' && ruta === '/api/users') {
      return responder(200, { users: cuentas.map((c, i) => ({ id: `u-${i}`, ...c, password: undefined, activo: true, roles: [c.tipo_usuario] })) })
    }
    if (req.method === 'POST' && ruta === '/api/auth/forgot-password') {
      if (cuentas.some((x) => x.email === cuerpo.email)) {
        const token = String(tokens.length + 1).padStart(64, 'e')
        tokens.push({ token, email: cuerpo.email, usado: false })
        correos.push({ para: cuerpo.email, enlace: `/reset-password?token=${token}&email=${encodeURIComponent(cuerpo.email)}` })
      }
      return responder(200, { message: MENSAJE_GENERICO })
    }
    if (req.method === 'GET' && ruta.startsWith('/api/auth/validate-reset-token/')) {
      const token = decodeURIComponent(ruta.split('/validate-reset-token/')[1])
      const t = tokens.find((x) => x.token === token && x.email === url.searchParams.get('email') && !x.usado)
      return t ? responder(200, { message: 'Token válido', valid: true }) : responder(400, { error: 'Token inválido o ya utilizado' })
    }
    if (req.method === 'POST' && ruta === '/api/auth/reset-password') {
      const t = tokens.find((x) => x.token === cuerpo.token && x.email === cuerpo.email && !x.usado)
      if (!t) return responder(400, { error: 'Token inválido o ya utilizado' })
      t.usado = true
      cuentas.find((x) => x.email === t.email)!.password = cuerpo.newPassword
      return responder(200, { message: 'Contraseña actualizada exitosamente' })
    }
    if (ruta.startsWith('/api/teachers/teacher-courses/')) return responder(200, [])
    return responder(200, {})
  })

  await new Promise<void>((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(puerto, resolve)
  })
  console.log(`Back simulado escuchando en http://localhost:${puerto}`)

  return {
    cuentas,
    tokens,
    correos,
    cerrar: () => new Promise<void>((resolve) => servidor.close(() => resolve())),
  }
}
