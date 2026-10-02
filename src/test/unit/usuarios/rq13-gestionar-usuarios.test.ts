import { describe, expect, it } from 'vitest'
import {
  aplicarAltaEnLista,
  aplicarDesactivarEnLista,
  armarCorreoInstitucional,
  decidirAccesoAdminUsers,
  decidirAltaUsuario,
  decidirCambioUsuario,
  decidirDesactivarUsuario,
  dominioCorreoPorRoles,
  dominioCorreoPorTipo,
  esAutoDesactivacion,
  rolesDelUsuario,
  usuarioDeCorreo,
  type UsuarioLista,
} from '../../../features/dashboard-admin/gestionar-usuarios'

const ADMIN = { token: 'jwt', savedUser: '{}', user: { tipo_usuario: 'admin', roles: ['admin'] } }

const ANA: UsuarioLista = {
  id: 'u-1',
  email: 'ana@soyudemedellin.edu.co',
  nombre: 'Ana',
  apellido: 'Pérez',
  tipo_usuario: 'estudiante',
  activo: true,
}

/**
 * RQ13 en la pantalla de admin: solo el admin crea, el alta no guarda la
 * contraseña, el correo repetido y el cambio vacío se quedan en el formulario,
 * y el admin no se desactiva a sí mismo.
 */
describe('RQ13 — Gestionar usuarios', () => {
  it('el admin crea el usuario y la lista no guarda la contraseña', () => {
    // Act
    const acceso = decidirAccesoAdminUsers(ADMIN)
    const alta = decidirAltaUsuario({ altaOk: true })
    const lista = aplicarAltaEnLista([], ANA, true)
    const correo = armarCorreoInstitucional('Ana', 'estudiante')

    // Assert
    expect(acceso, 'acceso').to.equal('ok')
    expect(alta, 'alta').to.include({ destino: 'recarga', formError: null, cierraModal: true, recargaLista: true })
    expect(lista[0], 'usuario').to.include({ email: ANA.email, nombre: 'Ana' })
    expect(lista[0], 'clave').to.not.have.property('password')
    expect(correo, 'correo').to.equal('ana@soyudemedellin.edu.co')
  })

  it('quien no es admin no entra, y el correo repetido no crea otro usuario', () => {
    // Act
    const acceso = decidirAccesoAdminUsers({
      token: 'jwt',
      savedUser: '{}',
      user: { tipo_usuario: 'estudiante', roles: ['estudiante'] },
    })
    const duplicado = decidirAltaUsuario({ altaOk: false, error: 'El email ya está registrado' })
    const lista = aplicarAltaEnLista([ANA], { ...ANA, id: 'u-2' }, false)

    // Assert
    expect(acceso, 'acceso').to.equal('forbidden')
    expect(duplicado, 'duplicado').to.include({
      destino: 'error-form',
      formError: 'El email ya está registrado',
      cierraModal: false,
      recargaLista: false,
    })
    expect(lista, 'lista').to.have.lengthOf(1)
  })

  it('el admin no se desactiva a sí mismo ni guarda un cambio vacío', () => {
    // Act
    const propia = esAutoDesactivacion('admin-1', 'admin-1')
    const ajena = esAutoDesactivacion('admin-1', 'u-1')
    const baja = decidirDesactivarUsuario({ desactivarOk: false, error: 'No puedes desactivar tu propia cuenta' })
    const vacio = decidirCambioUsuario({ cambioOk: false, error: 'No hay campos para actualizar' })
    const lista = aplicarDesactivarEnLista([ANA], ANA.id, false)

    // Assert
    expect(propia, 'propia').to.equal(true)
    expect(ajena, 'ajena').to.equal(false)
    expect(baja, 'baja').to.include({ destino: 'error-lista', recargaLista: false })
    expect(baja.error, 'error baja').to.be.a('string').and.not.to.be.empty
    expect(vacio, 'vacío').to.include({
      destino: 'error-form',
      formError: 'No hay campos para actualizar',
      cierraModal: false,
      recargaLista: false,
    })
    expect(lista[0].activo, 'sigue activo').to.equal(true)
  })

  it('sin token vuelve al login y un local inválido no arma correo', () => {
    // Act
    const acceso = decidirAccesoAdminUsers({ token: null, savedUser: '{}', user: ADMIN.user })
    const invalido = armarCorreoInstitucional('ana pérez!', 'profesor')
    const profesor = armarCorreoInstitucional('ana.perez', ['profesor'])
    const roles = rolesDelUsuario({ tipo_usuario: 'coordinador', roles: [] })

    // Assert
    expect(acceso, 'acceso').to.equal('login')
    expect(invalido, 'inválido').to.equal(null)
    expect(profesor, 'profesor').to.equal('ana.perez@udemedellin.edu.co')
    expect(dominioCorreoPorTipo('estudiante'), 'dominio estudiante').to.equal('soyudemedellin.edu.co')
    expect(dominioCorreoPorRoles(['admin', 'estudiante']), 'dominio roles').to.equal('soyudemedellin.edu.co')
    expect(usuarioDeCorreo(' Ana@Uni.edu '), 'local').to.equal('ana')
    expect(roles, 'roles').to.deep.equal(['coordinador'])
  })

  it('desactivar a otro usuario lo marca inactivo y conserva al resto', () => {
    // Arrange
    const otro: UsuarioLista = { ...ANA, id: 'u-2', email: 'luis@udemedellin.edu.co', nombre: 'Luis' }

    // Act
    const lista = aplicarDesactivarEnLista([ANA, otro], 'u-2', true)

    // Assert
    expect(lista[0].activo, 'ana').to.equal(true)
    expect(lista[1], 'luis').to.include({ id: 'u-2', activo: false })
  })
})
