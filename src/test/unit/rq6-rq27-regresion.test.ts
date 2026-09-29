import { describe, expect, it } from 'vitest'
import { decidirAccesoRuta, usuarioTieneRol, type UsuarioDashboard } from '../../features/auth/dashboard-path'
import { decidirEntradaQr, mensajeTokenQr, tokenDesdeUrl } from '../../features/evaluations/qr-entrada'
import { decidirGeneracionQr, validarCorreoQr } from '../../features/evaluations/qr-validacion'
import {
  decidirCargaMaterias,
  filasVistaMaterias,
  materiasDesdeApi,
  materiasTrasErrorApi,
} from '../../features/dashboard-student/estudiante-materias'

/**
 * Regresión de RQ6, RQ14, RQ15, RQ16, RQ17 y RQ27 en el front.
 * Cada caso es independiente: datos locales, una operación y la comprobación.
 */

const ESTUDIANTE: UsuarioDashboard = { tipo_usuario: 'estudiante', roles: ['estudiante'] }
const ADMIN: UsuarioDashboard = { tipo_usuario: 'admin', roles: ['admin'] }

const MATERIA = {
  id: 11,
  grupo: {
    numeroGrupo: 1,
    horario: 'Lun 8-10',
    aula: 'A-101',
    curso: { id: 31, codigo: 'SIS-101', nombre: 'Programación I' },
    profesor: { nombre: 'Ana Pérez' },
    periodo: { codigo: '2026-1', nombre: '2026-I' },
  },
}

const VISTA = {
  id: 11,
  codigo: 'SIS-101',
  nombre: 'Programación I',
  grupo: 'Grupo 1',
  profesor: 'Ana Pérez',
  periodo: '2026-1',
  horario: 'Lun 8-10',
  aula: 'A-101',
}

describe('Regresión de RQ6, RQ14, RQ15, RQ16, RQ17 y RQ27', () => {
  describe('RQ6 — Control de acceso por roles', () => {
    it('regresión: el estudiante entra a su propia ruta', () => {
      // Arrange: datos locales y controlados para mantener la independencia.
      const sesion = { token: 'jwt', savedUser: '{}', user: ESTUDIANTE, allowedRoles: ['estudiante'] }

      // Act: una sola operación principal.
      const resultado = decidirAccesoRuta(sesion)

      // Assert: la prueba se valida automáticamente.
      expect(resultado, 'acceso').to.equal('ok')
    })

    it('regresión: el mismo estudiante no entra al panel de admin', () => {
      // Arrange
      const sesion = { token: 'jwt', savedUser: '{}', user: ESTUDIANTE, allowedRoles: ['admin'] }

      // Act
      const resultado = decidirAccesoRuta(sesion)

      // Assert
      expect(resultado, 'acceso').to.equal('forbidden')
    })

    it('regresión: sin token vuelve al login', () => {
      // Arrange
      const sesion = { token: null, savedUser: '{}', user: ADMIN, allowedRoles: ['admin'] }

      // Act
      const resultado = decidirAccesoRuta(sesion)

      // Assert
      expect(resultado, 'acceso').to.equal('login')
    })

    it.each(['estudiante', 'Estudiante', 'student'])(
      'regresión: el tipo %s cuenta como estudiante',
      (tipo) => {
        // Arrange
        const usuario = { tipo_usuario: tipo }

        // Act
        const resultado = usuarioTieneRol(usuario, 'estudiante')

        // Assert
        expect(resultado, 'rol').to.equal(true)
      },
    )

    it('regresión: un usuario nulo no tiene rol', () => {
      // Act
      const resultado = usuarioTieneRol(null, 'admin')

      // Assert
      expect(resultado, 'rol').to.equal(false)
    })

    it('regresión: con varios roles reconoce al admin', () => {
      // Arrange
      const usuario = { roles: ['estudiante', 'admin'] }

      // Act
      const resultado = usuarioTieneRol(usuario, 'admin')

      // Assert
      expect(resultado, 'rol').to.equal(true)
    })

    it('regresión: un solo rol en la lista, sin tipo, no autoriza', () => {
      // Arrange
      const usuario = { roles: ['admin'] }

      // Act
      const resultado = usuarioTieneRol(usuario, 'admin')

      // Assert
      expect(resultado, 'rol').to.equal(false)
    })
  })

  describe('RQ14 — Auto-inscripción por QR', () => {
    const entrada = { token: 'tok-1', sesion: true, qrValido: true, autoEnrollOk: true }

    it('regresión: el estudiante inscrito llega al formulario', () => {
      // Arrange: datos locales y controlados para mantener la independencia.
      const params = { ...entrada }

      // Act: una sola operación principal.
      const resultado = decidirEntradaQr(params)

      // Assert: la prueba se valida automáticamente.
      expect(resultado, 'destino').to.equal('formulario')
    })

    it('regresión: si la inscripción falla no abre el formulario', () => {
      // Arrange
      const params = { ...entrada, autoEnrollOk: false }

      // Act
      const resultado = decidirEntradaQr(params)

      // Assert
      expect(resultado, 'destino').to.equal('error-api')
    })

    it('regresión: un QR inválido tampoco inscribe al formulario', () => {
      // Arrange
      const params = { ...entrada, qrValido: false }

      // Act
      const resultado = decidirEntradaQr(params)

      // Assert
      expect(resultado, 'destino').to.equal('error-api')
    })
  })

  describe('RQ15 — Generación masiva de QR', () => {
    it('regresión: fechas en orden y un grupo real permiten generar', () => {
      // Arrange: datos locales y controlados para mantener la independencia.
      const pedido = { grupoIds: [0, 12], startDate: '2026-01-01', endDate: '2026-06-30' }

      // Act: una sola operación principal.
      const resultado = decidirGeneracionQr(pedido)

      // Assert: la prueba se valida automáticamente.
      expect(resultado, 'generación').to.deep.equal({ ok: true })
    })

    it('regresión: las fechas al revés se rechazan', () => {
      // Arrange
      const pedido = { grupoIds: [12], startDate: '2026-06-01', endDate: '2026-01-01' }

      // Act
      const resultado = decidirGeneracionQr(pedido)

      // Assert
      expect(resultado, 'generación').to.include({
        ok: false,
        error: 'La fecha de inicio no puede ser posterior a la de fin.',
      })
    })

    it.each([
      { caso: 'vacío', grupoIds: [] as number[] },
      { caso: 'en cero', grupoIds: [0] },
      { caso: 'negativo', grupoIds: [-3] },
      { caso: 'decimal', grupoIds: [1.5] },
    ])('regresión: grupoIds $caso no genera el QR', ({ grupoIds }) => {
      // Arrange
      const pedido = { grupoIds, startDate: '2026-01-01', endDate: '2026-06-30' }

      // Act
      const resultado = decidirGeneracionQr(pedido)

      // Assert
      expect(resultado, 'generación').to.include({
        ok: false,
        error: 'Se requiere grupoIds (array de IDs de grupo).',
      })
    })
  })

  describe('RQ16 — Distribución de QR por correo', () => {
    it('regresión: correo, asunto y grupos dejan enviar', () => {
      // Arrange: datos locales y controlados para mantener la independencia.
      const cuerpo = { to: ' ana@udemedellin.edu.co ', subject: 'Evaluación', grupoIds: [3, 3] }

      // Act: una sola operación principal.
      const resultado = validarCorreoQr(cuerpo)

      // Assert: la prueba se valida automáticamente.
      expect(resultado, 'correo').to.deep.equal({ ok: true })
    })

    it('regresión: un correo inválido se rechaza', () => {
      // Arrange
      const cuerpo = { to: 'no-es-correo', subject: 'Evaluación', grupoIds: [3] }

      // Act
      const resultado = validarCorreoQr(cuerpo)

      // Assert
      expect(resultado, 'correo').to.include({ ok: false, error: 'Correo de destino inválido.' })
    })

    it('regresión: un asunto vacío se rechaza', () => {
      // Arrange
      const cuerpo = { to: 'ana@udemedellin.edu.co', subject: '   ', grupoIds: [3] }

      // Act
      const resultado = validarCorreoQr(cuerpo)

      // Assert
      expect(resultado, 'correo').to.include({ ok: false, error: 'El asunto es requerido.' })
    })

    it('regresión: sin grupos no hay correo que enviar', () => {
      // Arrange
      const cuerpo = { to: 'ana@udemedellin.edu.co', subject: 'Evaluación', grupoIds: [] }

      // Act
      const resultado = validarCorreoQr(cuerpo)

      // Assert
      expect(resultado, 'correo').to.include({
        ok: false,
        error: 'Se requiere grupoIds (array de IDs de grupo).',
      })
    })
  })

  describe('RQ17 — Resolución de token QR', () => {
    it('regresión: la url entrega el token del QR', () => {
      // Arrange: datos locales y controlados para mantener la independencia.
      const busqueda = '?token=tok-1'

      // Act: una sola operación principal.
      const resultado = tokenDesdeUrl(busqueda)

      // Assert: la prueba se valida automáticamente.
      expect(resultado, 'token').to.equal('tok-1')
    })

    it('regresión: una url sin token no inventa uno', () => {
      // Arrange
      const busqueda = '?otro=1'

      // Act
      const resultado = tokenDesdeUrl(busqueda)

      // Assert
      expect(resultado, 'token').to.equal(null)
    })

    it('regresión: sin token el mensaje explica el error', () => {
      // Act
      const resultado = mensajeTokenQr(null)

      // Assert
      expect(resultado, 'mensaje').to.equal('No se encontró token en el QR.')
    })

    it('regresión: con token no hay mensaje de error', () => {
      // Arrange
      const token = 'tok-1'

      // Act
      const resultado = mensajeTokenQr(token)

      // Assert
      expect(resultado, 'mensaje').to.equal(null)
    })

    it('regresión: sin token no abre el formulario', () => {
      // Arrange
      const params = { token: null, sesion: true, qrValido: true, autoEnrollOk: true }

      // Act
      const resultado = decidirEntradaQr(params)

      // Assert
      expect(resultado, 'destino').to.equal('error-local')
    })

    it('regresión: sin sesión manda al login', () => {
      // Arrange
      const params = { token: 'tok-1', sesion: false, qrValido: true, autoEnrollOk: true }

      // Act
      const resultado = decidirEntradaQr(params)

      // Assert
      expect(resultado, 'destino').to.equal('login')
    })
  })

  describe('RQ27 — Relación estudiante–materia', () => {
    it('regresión: el estudiante ve su materia con curso, profesor y periodo', () => {
      // Arrange: datos locales y controlados para mantener la independencia.
      const carga = { haySesion: true, type: 'student', materiasOk: true }

      // Act: una sola operación principal.
      const destino = decidirCargaMaterias(carga)
      const vista = filasVistaMaterias([MATERIA])

      // Assert: la prueba se valida automáticamente.
      expect(destino, 'carga').to.equal('pintar')
      expect(vista, 'materias').to.deep.equal([VISTA])
    })

    it('regresión: la materia sin curso no aparece', () => {
      // Arrange
      const materias = [MATERIA, { id: 99, grupo: { numeroGrupo: 2 } }]

      // Act
      const vista = filasVistaMaterias(materias)
      const ids = vista.map((fila) => fila.id)

      // Assert: aserciones expresivas sobre una colección.
      expect(ids, 'materias').to.have.lengthOf(1)
      expect(ids, 'ids').to.deep.equal([11])
    })

    it('regresión: un grupo que llega en arreglo no se pinta', () => {
      // Arrange
      const materias = [{ ...MATERIA, grupo: [MATERIA.grupo] }]

      // Act
      const vista = filasVistaMaterias(materias)

      // Assert: aserciones expresivas sobre una colección.
      expect(vista, 'materias').to.have.lengthOf(0)
      expect(vista, 'lista').to.deep.equal([])
    })

    it('regresión: un número de grupo que no es texto ni número queda sin grupo', () => {
      const materia = { ...MATERIA, grupo: { ...MATERIA.grupo, numeroGrupo: null } }

      const vista = filasVistaMaterias([materia])

      expect(vista[0].grupo, 'grupo').to.equal('Sin grupo')
    })

    it.each(['teacher', 'Student', 'estudiante'])(
      'regresión: el tipo %s no carga las materias',
      (tipo) => {
        // Arrange
        const carga = { haySesion: true, type: tipo, materiasOk: true }

        // Act
        const resultado = decidirCargaMaterias(carga)

        // Assert
        expect(resultado, 'carga').to.equal('no-cargar')
      },
    )

    it('regresión: sin sesión vuelve al login', () => {
      // Arrange
      const carga = { haySesion: false, type: 'student', materiasOk: true }

      // Act
      const resultado = decidirCargaMaterias(carga)

      // Assert
      expect(resultado, 'carga').to.equal('login')
    })

    it('regresión: sin datos de la api la lista queda vacía', () => {
      // Arrange
      const carga = { haySesion: true, type: 'student', materiasOk: false }

      // Act
      const destino = decidirCargaMaterias(carga)
      const lista = materiasTrasErrorApi()

      // Assert
      expect(destino, 'carga').to.equal('vacias')
      expect(lista.materiasMatriculadas, 'materias').to.have.lengthOf(0)
      expect(lista.total, 'total').to.equal(0)
    })

    it('regresión: la respuesta nula no inventa materias', () => {
      // Act
      const resultado = materiasDesdeApi(null)

      // Assert
      expect(resultado, 'materias').to.deep.equal({ materiasMatriculadas: [], total: 0 })
    })
  })
})
