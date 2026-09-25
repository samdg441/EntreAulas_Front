import { describe, it, expect } from 'vitest'
import { validatePasswordStrength } from '../../lib/validation'
import {
  decidirAccesoAdminUsers,
  decidirAltaUsuario,
  decidirCambioUsuario,
  decidirDesactivarUsuario,
  aplicarAltaEnLista,
  aplicarCambioEnLista,
  aplicarDesactivarEnLista,
  muestraBotonDesactivar,
  esAutoDesactivacion,
  mensajeErrorAccion,
  type UsuarioLista,
} from '../../features/dashboard-admin/gestionar-usuarios'

describe('RQ1 — Registro de usuarios desde admin', () => {
  describe('decidirAccesoAdminUsers — la página es exclusiva de admin', () => {
    it('exige login sin token o sin usuario guardado', () => {
      expect(decidirAccesoAdminUsers({ token: null, savedUser: '{}', user: { tipo_usuario: 'admin' } })).toBe(
        'login'
      )
    })

    it('rechaza con forbidden a cualquier rol distinto de admin', () => {
      expect(
        decidirAccesoAdminUsers({ token: 'tok', savedUser: '{}', user: { tipo_usuario: 'coordinador' } })
      ).toBe('forbidden')
    })

    it('permite el acceso a un usuario admin', () => {
      expect(
        decidirAccesoAdminUsers({ token: 'tok', savedUser: '{}', user: { tipo_usuario: 'admin' } })
      ).toBe('ok')
    })
  })

  describe('validatePasswordStrength — política exigida al crear el usuario', () => {
    it('rechaza contraseñas de menos de 8 caracteres', () => {
      const resultado = validatePasswordStrength('Ab1!')
      expect(resultado.valid).toBe(false)
      expect(resultado.message).toBe('La contraseña debe tener al menos 8 caracteres')
    })

    it('exige al menos una mayúscula', () => {
      expect(validatePasswordStrength('abcdefg1!').message).toBe(
        'La contraseña debe contener al menos una letra mayúscula'
      )
    })

    it('exige al menos una minúscula', () => {
      expect(validatePasswordStrength('ABCDEFG1!').message).toBe(
        'La contraseña debe contener al menos una letra minúscula'
      )
    })

    it('exige al menos un número', () => {
      expect(validatePasswordStrength('Abcdefgh!').message).toBe(
        'La contraseña debe contener al menos un número'
      )
    })

    it('exige al menos un carácter especial', () => {
      expect(validatePasswordStrength('Abcdefg1').message).toBe(
        'La contraseña debe contener al menos un carácter especial'
      )
    })

    it('acepta una contraseña que cumple las cinco reglas (límite: 8 caracteres exactos)', () => {
      expect(validatePasswordStrength('Abcdef1!')).toEqual({ valid: true, message: null })
    })
  })

  describe('decidirAltaUsuario', () => {
    it('en éxito, recarga la lista y cierra el modal sin mensaje de error', () => {
      expect(decidirAltaUsuario({ altaOk: true })).toEqual({
        destino: 'recarga',
        formError: null,
        cierraModal: true,
        recargaLista: true,
      })
    })

    it('en fallo, mantiene el modal abierto y muestra el error del backend', () => {
      expect(decidirAltaUsuario({ altaOk: false, error: 'El correo ya está registrado' })).toEqual({
        destino: 'error-form',
        formError: 'El correo ya está registrado',
        cierraModal: false,
        recargaLista: false,
      })
    })

    it('en fallo sin mensaje del backend, usa el mensaje genérico', () => {
      expect(decidirAltaUsuario({ altaOk: false }).formError).toBe('Error al crear usuario')
    })
  })

  describe('decidirCambioUsuario', () => {
    it('en éxito, recarga y cierra modal', () => {
      expect(decidirCambioUsuario({ cambioOk: true })).toEqual({
        destino: 'recarga',
        formError: null,
        cierraModal: true,
        recargaLista: true,
      })
    })

    it('en fallo, deja el formulario abierto con el error', () => {
      expect(decidirCambioUsuario({ cambioOk: false, error: 'Email inválido' }).formError).toBe(
        'Email inválido'
      )
    })
  })

  describe('decidirDesactivarUsuario', () => {
    it('en éxito, recarga la lista sin error', () => {
      expect(decidirDesactivarUsuario({ desactivarOk: true })).toEqual({
        destino: 'recarga',
        error: null,
        recargaLista: true,
      })
    })

    it('en fallo, reporta el error en la lista sin recargar', () => {
      expect(decidirDesactivarUsuario({ desactivarOk: false, error: 'No autorizado' })).toEqual({
        destino: 'error-lista',
        error: 'No autorizado',
        recargaLista: false,
      })
    })
  })

  describe('aplicarAltaEnLista / aplicarCambioEnLista / aplicarDesactivarEnLista', () => {
    const lista: UsuarioLista[] = [
      { id: '1', email: 'a@uni.edu', nombre: 'Ana', apellido: 'Pérez', tipo_usuario: 'estudiante', activo: true },
    ]
    const nuevo: UsuarioLista = {
      id: '2',
      email: 'b@uni.edu',
      nombre: 'Luis',
      apellido: 'Gómez',
      tipo_usuario: 'profesor',
      activo: true,
    }

    it('agrega el usuario nuevo al final de la lista solo si la alta fue exitosa', () => {
      expect(aplicarAltaEnLista(lista, nuevo, true)).toEqual([...lista, nuevo])
      expect(aplicarAltaEnLista(lista, nuevo, false)).toBe(lista)
    })

    it('aplica los cambios sobre el usuario correcto sin tocar el resto de la lista', () => {
      const actualizada = aplicarCambioEnLista(lista, '1', { nombre: 'Ana María' }, true)
      expect(actualizada[0]).toMatchObject({ id: '1', nombre: 'Ana María' })
      expect(aplicarCambioEnLista(lista, '1', { nombre: 'Otro' }, false)).toBe(lista)
    })

    it('desactiva (activo=false) solo el usuario indicado cuando la operación fue exitosa', () => {
      const actualizada = aplicarDesactivarEnLista(lista, '1', true)
      expect(actualizada[0].activo).toBe(false)
      expect(aplicarDesactivarEnLista(lista, '1', false)).toBe(lista)
    })
  })

  describe('muestraBotonDesactivar / esAutoDesactivacion', () => {
    it('solo muestra el botón de desactivar para usuarios activos', () => {
      expect(muestraBotonDesactivar({ activo: true } as UsuarioLista)).toBe(true)
      expect(muestraBotonDesactivar({ activo: false } as UsuarioLista)).toBe(false)
    })

    it('detecta cuando el admin intenta desactivarse a sí mismo', () => {
      expect(esAutoDesactivacion('admin-1', 'admin-1')).toBe(true)
      expect(esAutoDesactivacion('admin-1', 'user-2')).toBe(false)
    })
  })

  describe('mensajeErrorAccion', () => {
    it('prioriza el mensaje de error del backend', () => {
      expect(
        mensajeErrorAccion({ response: { data: { error: 'Rol no permitido' } } }, 'fallback')
      ).toBe('Rol no permitido')
    })

    it('usa error.message si no hay respuesta del backend', () => {
      expect(mensajeErrorAccion({ message: 'Network Error' }, 'fallback')).toBe('Network Error')
    })

    it('usa el fallback cuando el error es null', () => {
      expect(mensajeErrorAccion(null, 'No se pudo completar la acción')).toBe(
        'No se pudo completar la acción'
      )
    })
  })
})
