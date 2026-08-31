import { describe, expect, it } from 'vitest'
import { validarCamposCreacionUsuario } from '../helpers/auth'

class RQ1CrearUsuarioAdmin {
  C1_camposFaltantes() {
    const r = validarCamposCreacionUsuario({
      email: 'nuevo@test.com',
      nombre: 'Ana',
      apellido: 'Perez',
      tipo_usuario: 'estudiante',
    })
    expect(r.ok).toBe(false)
    expect(r.error).toBe('Todos los campos son requeridos')
  }

  C2_correoInvalido() {
    const r = validarCamposCreacionUsuario({
      email: 'no-es-correo',
      password: 'password123',
      nombre: 'Ana',
      apellido: 'Perez',
      tipo_usuario: 'estudiante',
    })
    expect(r.ok).toBe(false)
    expect(r.error).toBe('Correo inválido')
  }

  C3_contrasenaCorta() {
    const r = validarCamposCreacionUsuario({
      email: 'nuevo@test.com',
      password: 'corta',
      nombre: 'Ana',
      apellido: 'Perez',
      tipo_usuario: 'estudiante',
    })
    expect(r.ok).toBe(false)
    expect(r.error).toBe('La contraseña debe tener al menos 8 caracteres')
  }

  C4_caminoIdeal() {
    const r = validarCamposCreacionUsuario({
      email: 'nuevo@test.com',
      password: 'password123',
      nombre: 'Ana',
      apellido: 'Perez',
      tipo_usuario: 'estudiante',
    })
    expect(r.ok).toBe(true)
  }
}

const pruebas = new RQ1CrearUsuarioAdmin()

describe('RQ1 — Crear usuario como administrador', () => {
  it('C1: campos faltantes', () => pruebas.C1_camposFaltantes())
  it('C2: correo inválido', () => pruebas.C2_correoInvalido())
  it('C3: contraseña corta', () => pruebas.C3_contrasenaCorta())
  it('C4: datos correctos', () => pruebas.C4_caminoIdeal())
})
