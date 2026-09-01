import { decidirAccesoRuta } from '../../features/auth/dashboard-path'

export type UsuarioLista = {
  id: string
  email: string
  nombre: string
  apellido: string
  tipo_usuario: string
  activo: boolean
}

export function decidirAccesoAdminUsers(params: {
  token: string | null
  savedUser: string | null
  user: { tipo_usuario?: string; roles?: string[] } | null
}): 'login' | 'forbidden' | 'ok' {
  return decidirAccesoRuta({
    token: params.token,
    savedUser: params.savedUser,
    user: params.user,
    allowedRoles: ['admin'],
  })
}

export function mensajeErrorAccion(
  error: { response?: { data?: { error?: string } }; message?: string } | null,
  fallback: string
): string {
  return error?.response?.data?.error || error?.message || fallback
}

export function decidirAltaUsuario(params: { altaOk: boolean; error?: string }): {
  destino: 'error-form' | 'recarga'
  formError: string | null
  cierraModal: boolean
  recargaLista: boolean
} {
  if (!params.altaOk) {
    return {
      destino: 'error-form',
      formError: params.error || 'Error al crear usuario',
      cierraModal: false,
      recargaLista: false,
    }
  }
  return { destino: 'recarga', formError: null, cierraModal: true, recargaLista: true }
}

export function decidirCambioUsuario(params: { cambioOk: boolean; error?: string }): {
  destino: 'error-form' | 'recarga'
  formError: string | null
  cierraModal: boolean
  recargaLista: boolean
} {
  if (!params.cambioOk) {
    return {
      destino: 'error-form',
      formError: params.error || 'Error al actualizar',
      cierraModal: false,
      recargaLista: false,
    }
  }
  return { destino: 'recarga', formError: null, cierraModal: true, recargaLista: true }
}

export function decidirDesactivarUsuario(params: {
  desactivarOk: boolean
  error?: string
}): {
  destino: 'error-lista' | 'recarga'
  error: string | null
  recargaLista: boolean
} {
  if (!params.desactivarOk) {
    return {
      destino: 'error-lista',
      error: params.error || 'No se pudo desactivar el usuario',
      recargaLista: false,
    }
  }
  return { destino: 'recarga', error: null, recargaLista: true }
}

export function aplicarAltaEnLista(lista: UsuarioLista[], nuevo: UsuarioLista, altaOk: boolean) {
  if (!altaOk) return lista
  return [...lista, nuevo]
}

export function aplicarCambioEnLista(
  lista: UsuarioLista[],
  id: string,
  cambios: Partial<UsuarioLista>,
  cambioOk: boolean
) {
  if (!cambioOk) return lista
  return lista.map((u) => (u.id === id ? { ...u, ...cambios } : u))
}

export function aplicarDesactivarEnLista(lista: UsuarioLista[], id: string, desactivarOk: boolean) {
  if (!desactivarOk) return lista
  return lista.map((u) => (u.id === id ? { ...u, activo: false } : u))
}

export function muestraBotonDesactivar(u: UsuarioLista): boolean {
  return u.activo
}

export function esAutoDesactivacion(adminId: string, targetId: string): boolean {
  return adminId === targetId
}
