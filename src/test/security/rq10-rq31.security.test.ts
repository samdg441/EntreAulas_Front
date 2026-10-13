import { describe, expect, it } from 'vitest'
import { decidirCargaStatsEstudiante, statsDesdeApi } from '../../features/dashboard-student/estudiante-stats'
import { armarPayloadEvaluacion, decidirEnvioFormulario } from '../../features/evaluations/evaluacion-docente'
import {
  aplicarAltaEnLista,
  armarCorreoInstitucional,
  decidirAccesoAdminUsers,
  esAutoDesactivacion,
  type UsuarioLista,
} from '../../features/dashboard-admin/gestionar-usuarios'
import { decidirVistaResumen, endpointPorRol } from '../../features/evaluations/resumen-ia'
import { decidirVistaAlerta, muestraBannerAcoso, type ResultadoAlerta } from '../../features/evaluations/alerta-acoso'

const ADMIN = { token: 'jwt', savedUser: '{}', user: { tipo_usuario: 'admin', roles: ['admin'] } }
const ANA: UsuarioLista = {
  id: 'u-1',
  email: 'ana@soyudemedellin.edu.co',
  nombre: 'Ana',
  apellido: 'Pérez',
  tipo_usuario: 'estudiante',
  activo: true,
}

describe('RQ10 — Seguridad: las estadísticas son solo del estudiante', () => {
  it.each(['profesor', 'docente', 'coordinador', 'admin'])('el tipo %j no carga las estadísticas', (tipoUsuario) => {
    expect(decidirCargaStatsEstudiante({ haySesion: true, tipoUsuario, statsOk: true })).toBe('no-cargar')
  })

  it('sin sesión no hay estadísticas, aunque el cuerpo diga que sí', () => {
    expect(decidirCargaStatsEstudiante({ haySesion: false, tipoUsuario: 'estudiante', statsOk: true })).toBe('login')
  })

  it('un valor que no es número no se pinta como texto ejecutable', () => {
    const stats = statsDesdeApi({
      evaluacionesCompletadas: '<script>alert(1)</script>' as unknown as number,
      evaluacionesPendientes: "1; DROP TABLE" as unknown as number,
      materiasMatriculadas: 2,
      promedioGeneral: '<img src=x onerror=alert(1)>' as unknown as number,
      progresoGeneral: 100,
    })

    expect(stats.evaluacionesCompletadas).toBeNaN()
    expect(stats.evaluacionesPendientes).toBeNaN()
    expect(stats.promedioGeneral).toBeNaN()
    expect(JSON.stringify(stats)).not.toContain('<script>')
    expect(JSON.stringify(stats)).not.toContain('DROP TABLE')
  })
})

describe('RQ11 — Seguridad: el envío no incorpora la carga maliciosa', () => {
  it('un id de pregunta con SQL queda en el número, no en la sentencia', () => {
    const payload = armarPayloadEvaluacion({
      teacher: { id: 7 },
      course: { id: 31 },
      questions: [{ id: '2; DELETE FROM respuestas', type: 'rating' }],
      ratings: [5],
      textAnswers: [],
      comments: '<script>alert(1)</script>',
    })

    expect(payload.answers[0].questionId).toBe(2)
    expect(JSON.stringify(payload.answers)).not.toContain('DELETE FROM')
    expect(payload.comments).toBe('<script>alert(1)</script>')
    expect(payload).not.toHaveProperty('password')
  })

  it('sin profesor o sin curso el envío no llega al goodbye', () => {
    expect(
      decidirEnvioFormulario({ haySesion: true, confirma: true, teacher: null, course: { id: 31 }, envioOk: true })
    ).toBe('faltan-datos')
    expect(
      decidirEnvioFormulario({ haySesion: false, confirma: true, teacher: { id: 7 }, course: { id: 31 }, envioOk: true })
    ).toBe('login')
  })
})

describe('RQ13 — Seguridad: alta de usuarios', () => {
  it.each([
    { caso: 'sin token', token: null, user: { tipo_usuario: 'admin' }, esperado: 'login' },
    { caso: 'profesor', token: 'jwt', user: { tipo_usuario: 'profesor' }, esperado: 'forbidden' },
    { caso: 'estudiante', token: 'jwt', user: { tipo_usuario: 'estudiante' }, esperado: 'forbidden' },
    { caso: 'admin', token: 'jwt', user: ADMIN.user, esperado: 'ok' },
  ])('$caso → $esperado', ({ token, user, esperado }) => {
    expect(decidirAccesoAdminUsers({ token, savedUser: '{}', user })).toBe(esperado)
  })

  it('el usuario publicado no lleva contraseña', () => {
    const lista = aplicarAltaEnLista([], ANA, true)
    expect(lista[0]).not.toHaveProperty('password')
    expect(JSON.stringify(lista)).not.toMatch(/clave|password/i)
  })

  it.each(['ana\nBcc: todos@evil.co', 'ana\r\nCc: x@evil.co', 'ana con espacios', 'ana@evil.com<script>'])(
    'el correo %j no sale del dominio institucional',
    (local) => {
      const correo = armarCorreoInstitucional(local, 'estudiante')
      expect(correo === null || correo.endsWith('@soyudemedellin.edu.co')).toBe(true)
      expect(correo ?? '').not.toMatch(/[\r\n]|evil|script/i)
    }
  )

  it('un dominio ajeno se descarta y queda el institucional', () => {
    expect(armarCorreoInstitucional('ana@evil.co', 'estudiante')).toBe('ana@soyudemedellin.edu.co')
  })

  it('el admin no puede desactivarse a sí mismo', () => {
    expect(esAutoDesactivacion('admin-1', 'admin-1')).toBe(true)
    expect(esAutoDesactivacion('admin-1', 'u-2')).toBe(false)
  })
})

describe('RQ29 y RQ30 — Seguridad: quién puede ver un resumen', () => {
  it.each([401, 403])('un estado %i no pinta el resumen', (status) => {
    expect(
      decidirVistaResumen({
        haySesion: true,
        status,
        result: { textsCount: 4, analysisSource: 'open_text', summary: '<script>alert(1)</script>' },
      })
    ).toBe(status === 401 ? 'login' : 'error')
  })

  it.each([
    ['teacher', 'by-professor'],
    ['coordinator', 'by-career'],
    ['decano', 'by-faculty'],
    ['estudiante', 'by-professor'],
    ["coordinator' OR '1'='1", 'by-professor'],
  ] as const)('el rol %j pide %s y no escala de alcance', (rol, endpoint) => {
    expect(endpointPorRol(rol)).toBe(endpoint)
  })

  it('un texto corto de facultad no cuenta como comentario abierto', () => {
    expect(
      decidirVistaResumen({
        haySesion: true,
        status: 200,
        result: { textsCount: 0, summary: '<script>alert(1)</script>' },
      })
    ).toBe('aviso-sin-respuestas')
  })
})

describe('RQ31 — Seguridad: la alerta no se enciende con un dato suelto', () => {
  it('HTML o SQL sin un indicio de acoso no encienden el banner', () => {
    const alerta: ResultadoAlerta = {
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: false,
      acosoProfesores: [],
      summary: '<script>alert(1)</script>',
    }

    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: alerta })).toBe('resumen')
    expect(muestraBannerAcoso(alerta)).toBe(false)
  })

  it('la marca de acoso sin mensaje ni docentes no alcanza para alertar', () => {
    const alerta: ResultadoAlerta = {
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: true,
      acosoProfesores: [],
    }

    expect(muestraBannerAcoso(alerta)).toBe(false)
    expect(decidirVistaAlerta({ haySesion: true, status: 200, result: alerta })).toBe('resumen')
  })

  it('un estudiante con 403 no ve la alerta', () => {
    const alerta: ResultadoAlerta = {
      textsCount: 1,
      analysisSource: 'open_text',
      acosoDetectado: true,
      mensajeAcoso: 'Hubo acoso',
      acosoProfesores: [{ profesorId: '7', nombre: 'Ana', menciones: 1, ejemplos: ['Hubo acoso'] }],
    }

    expect(decidirVistaAlerta({ haySesion: true, status: 403, result: alerta })).toBe('error')
  })
})
