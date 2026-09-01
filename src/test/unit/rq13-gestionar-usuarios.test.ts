import { describe, expect, it } from 'vitest'
import {
  aplicarAltaEnLista,
  aplicarCambioEnLista,
  aplicarDesactivarEnLista,
  decidirAccesoAdminUsers,
  decidirAltaUsuario,
  decidirCambioUsuario,
  decidirDesactivarUsuario,
  esAutoDesactivacion,
  mensajeErrorAccion,
  muestraBotonDesactivar,
  type UsuarioLista,
} from '../helpers/gestionar-usuarios'

/**
 * RQ13 — Gestionar usuarios (frontend /admin/users)
 *
 *  3-5  ProtectedRoute admin: sin sesión → login; sin rol → forbidden
 *  6-9  POST create-user falla → error en modal, lista igual
 *  6-10 POST 201 → cierra modal y recarga lista
 * 11-14 PUT falla → error en modal, fila igual
 * 11-15 PUT 200 → cierra modal y actualiza fila
 * 16    Desactivar falla → error, sigue activo
 * 17    Desactivar OK → activo=false, desaparece el botón
 */

const ana: UsuarioLista = {
  id: 'u-1',
  email: 'ana@uni.edu',
  nombre: 'Ana',
  apellido: 'Perez',
  tipo_usuario: 'estudiante',
  activo: true,
}

const luis: UsuarioLista = {
  id: 'u-2',
  email: 'luis@uni.edu',
  nombre: 'Luis',
  apellido: 'Gomez',
  tipo_usuario: 'profesor',
  activo: true,
}

class RQ13GestionarUsuarios {
  // Nodo 3-5: sin token / sin user → /login
  N5_sinSesionVaALogin() {
    expect(decidirAccesoAdminUsers({ token: null, savedUser: null, user: null })).toBe('login')
    expect(decidirAccesoAdminUsers({ token: 'jwt', savedUser: null, user: null })).toBe('login')
  }

  // Nodo 3-5: autenticado pero no admin → /forbidden
  N5_noEsAdminVaAForbidden() {
    expect(
      decidirAccesoAdminUsers({
        token: 'jwt',
        savedUser: '{}',
        user: { tipo_usuario: 'estudiante', roles: ['estudiante'] },
      })
    ).toBe('forbidden')
    expect(
      decidirAccesoAdminUsers({
        token: 'jwt',
        savedUser: '{}',
        user: { tipo_usuario: 'profesor', roles: ['profesor'] },
      })
    ).toBe('forbidden')
  }

  // Nodo 3-4: admin con sesión entra a /admin/users
  N4_adminEntra() {
    expect(
      decidirAccesoAdminUsers({
        token: 'jwt',
        savedUser: '{}',
        user: { tipo_usuario: 'admin', roles: ['admin'] },
      })
    ).toBe('ok')
  }

  // Nodo 6-9: POST create-user falla → error en el modal, lista no cambia
  N9_altaFalla() {
    const r = decidirAltaUsuario({
      altaOk: false,
      error: mensajeErrorAccion(
        { response: { data: { error: 'El email ya está registrado' } } },
        'Error al crear usuario'
      ),
    })
    expect(r.destino).toBe('error-form')
    expect(r.formError).toBe('El email ya está registrado')
    expect(r.cierraModal).toBe(false)
    expect(r.recargaLista).toBe(false)

    const lista = aplicarAltaEnLista([ana], luis, false)
    expect(lista).toEqual([ana])
    expect(lista).toHaveLength(1)
  }

  // Nodo 6-10: POST 201 → cierra modal y el nuevo aparece en la lista
  N10_altaOk() {
    const r = decidirAltaUsuario({ altaOk: true })
    expect(r.destino).toBe('recarga')
    expect(r.formError).toBeNull()
    expect(r.cierraModal).toBe(true)
    expect(r.recargaLista).toBe(true)

    const lista = aplicarAltaEnLista([ana], luis, true)
    expect(lista).toHaveLength(2)
    expect(lista[1]).toMatchObject({ email: 'luis@uni.edu', tipo_usuario: 'profesor' })
  }

  // Nodo 11-14: PUT falla → error en modal de edición, fila igual
  N14_cambioFalla() {
    const r = decidirCambioUsuario({
      cambioOk: false,
      error: mensajeErrorAccion(
        { response: { data: { error: 'tipo_usuario inválido' } } },
        'Error al actualizar'
      ),
    })
    expect(r.destino).toBe('error-form')
    expect(r.formError).toBe('tipo_usuario inválido')
    expect(r.cierraModal).toBe(false)
    expect(r.recargaLista).toBe(false)

    const lista = aplicarCambioEnLista([ana], 'u-1', { nombre: 'Ana María' }, false)
    expect(lista[0].nombre).toBe('Ana')
  }

  // Nodo 11-15: PUT 200 → cierra modal y actualiza la fila
  N15_cambioOk() {
    const r = decidirCambioUsuario({ cambioOk: true })
    expect(r.destino).toBe('recarga')
    expect(r.cierraModal).toBe(true)
    expect(r.recargaLista).toBe(true)

    const lista = aplicarCambioEnLista(
      [ana, luis],
      'u-1',
      { nombre: 'Ana María', tipo_usuario: 'profesor' },
      true
    )
    expect(lista[0]).toMatchObject({ nombre: 'Ana María', tipo_usuario: 'profesor' })
    expect(lista[1].nombre).toBe('Luis')
  }

  // Nodo 16: desactivar falla (propia cuenta o error de API) → sigue activo
  N16_desactivarFalla() {
    expect(esAutoDesactivacion('admin-1', 'admin-1')).toBe(true)
    expect(esAutoDesactivacion('admin-1', 'u-1')).toBe(false)

    const r = decidirDesactivarUsuario({
      desactivarOk: false,
      error: mensajeErrorAccion(
        { response: { data: { error: 'No puedes desactivar tu propia cuenta' } } },
        'No se pudo desactivar el usuario'
      ),
    })
    expect(r.destino).toBe('error-lista')
    expect(r.error).toBe('No puedes desactivar tu propia cuenta')
    expect(r.recargaLista).toBe(false)

    const lista = aplicarDesactivarEnLista([ana], 'u-1', false)
    expect(lista[0].activo).toBe(true)
    expect(muestraBotonDesactivar(lista[0])).toBe(true)
  }

  // Nodo 17: desactivar OK → activo=false y ya no se muestra «Desactivar»
  N17_desactivarOk() {
    const r = decidirDesactivarUsuario({ desactivarOk: true })
    expect(r.destino).toBe('recarga')
    expect(r.error).toBeNull()
    expect(r.recargaLista).toBe(true)

    const lista = aplicarDesactivarEnLista([ana, luis], 'u-1', true)
    expect(lista[0].activo).toBe(false)
    expect(muestraBotonDesactivar(lista[0])).toBe(false)
    expect(lista[1].activo).toBe(true)
    expect(muestraBotonDesactivar(lista[1])).toBe(true)
  }

  FALLA_N5_estudianteEntraAlPanel() {
    expect(
      decidirAccesoAdminUsers({
        token: 'jwt',
        savedUser: '{}',
        user: { tipo_usuario: 'estudiante', roles: ['estudiante'] },
      })
    ).toBe('ok')
  }

  FALLA_N9_altaFallaIgualAgrega() {
    const lista = aplicarAltaEnLista([ana], luis, false)
    expect(lista).toHaveLength(2)
  }

  FALLA_N14_cambioFallaIgualEdita() {
    const lista = aplicarCambioEnLista([ana], 'u-1', { nombre: 'Ana María' }, false)
    expect(lista[0].nombre).toBe('Ana María')
  }

  FALLA_N16_autoDesactivarQuitaBoton() {
    const lista = aplicarDesactivarEnLista([ana], 'u-1', false)
    expect(lista[0].activo).toBe(false)
    expect(muestraBotonDesactivar(lista[0])).toBe(false)
  }
}

const pruebas = new RQ13GestionarUsuarios()

describe('RQ13 — Gestionar usuarios (frontend)', () => {
  it('Nodo 3-5: sin sesión → /login', () => pruebas.N5_sinSesionVaALogin())
  it('Nodo 3-5: no es admin → /forbidden', () => pruebas.N5_noEsAdminVaAForbidden())
  it('Nodo 3-4: admin con sesión entra', () => pruebas.N4_adminEntra())
  it('Nodo 6-9: POST falla → error en modal, lista igual', () => pruebas.N9_altaFalla())
  it('Nodo 6-10: POST 201 → cierra modal y recarga', () => pruebas.N10_altaOk())
  it('Nodo 11-14: PUT falla → error en modal, fila igual', () => pruebas.N14_cambioFalla())
  it('Nodo 11-15: PUT 200 → cierra modal y actualiza fila', () => pruebas.N15_cambioOk())
  it('Nodo 16: desactivar falla → sigue activo', () => pruebas.N16_desactivarFalla())
  it('Nodo 17: desactivar OK → inactivo y sin botón', () => pruebas.N17_desactivarOk())
  it('FALLA N5: estudiante — se espera (mal) ok', () => pruebas.FALLA_N5_estudianteEntraAlPanel())
  it('FALLA N9: alta fallida — se espera (mal) que agregue', () => pruebas.FALLA_N9_altaFallaIgualAgrega())
  it('FALLA N14: PUT fallido — se espera (mal) que edite', () => pruebas.FALLA_N14_cambioFallaIgualEdita())
  it('FALLA N16: desactivar fallido — se espera (mal) inactivo', () =>
    pruebas.FALLA_N16_autoDesactivarQuitaBoton())
})
