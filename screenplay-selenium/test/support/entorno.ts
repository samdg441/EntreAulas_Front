export const frontUrl = () => process.env.FRONT_URL ?? 'http://localhost:3001'
export const apiUrl = () => process.env.API_URL ?? 'http://localhost:3000'

export const CLAVE_FIXTURES = 'password123'

export const CUENTAS = {
  admin: { tipo: 'Administrador', correo: 'rq1.admin@entreaulas.test', clave: CLAVE_FIXTURES },
  estudiante: { tipo: 'Estudiante', correo: 'rq2.activo.estudiante@entreaulas.test', clave: CLAVE_FIXTURES },
  coordinador: { tipo: 'Coordinador', correo: 'rq2.coordinador@entreaulas.test', clave: CLAVE_FIXTURES },
  decano: { tipo: 'Decano', correo: 'rq2.decano@entreaulas.test', clave: CLAVE_FIXTURES },
  inactivo: { tipo: 'Estudiante', correo: 'rq2.inactivo@entreaulas.test', clave: CLAVE_FIXTURES },
}

export const USUARIO_RECUPERACION = 'usuario.activo@entreaulas.test'
export const TOKEN_EXPIRADO = 'b'.repeat(64)
export const TOKEN_INEXISTENTE = 'f'.repeat(64)

export const CLAVE_NUEVA_VALIDA = 'NuevaClave#2026'

export const correoUnico = (prefijo: string, dominio = 'soyudemedellin.edu.co') =>
  `${prefijo}.${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}@${dominio}`
