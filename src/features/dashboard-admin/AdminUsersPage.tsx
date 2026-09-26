import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card'
import ConfirmationModal from '../../components/ConfirmationModal'
import Badge from '../../components/Badge'
import { useAuth } from '../../context/AuthContext'
import {
  usersApi,
  UserSummary,
  CreateUserPayload,
  UpdateUserPayload,
} from '../../api/users'
import { Pencil, Plus, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { User } from '../../types'
import { getApiErrorMessage } from '../../lib/apiError'
import { validatePasswordStrength } from '../../lib/validation'
import {
  decidirAltaUsuario,
  decidirCambioUsuario,
  decidirDesactivarUsuario,
  aplicarAltaEnLista,
  aplicarCambioEnLista,
  aplicarDesactivarEnLista,
  armarCorreoInstitucional,
  dominioCorreoPorRoles,
  dominioCorreoPorTipo,
  rolesDelUsuario,
  usuarioDeCorreo,
  type UsuarioLista,
} from './gestionar-usuarios'

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href

const USER_TYPES = [
  'estudiante',
  'profesor',
  'coordinador',
  'decano',
  'admin',
] as const

const PAGE_SIZE = 10

const emptyCreate: CreateUserPayload = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  tipo_usuario: 'estudiante',
}

type ModalMode = 'create' | 'edit' | null

export default function AdminUsersPage() {
  const { user: authUser } = useAuth()
  const headerUser: User = {
    id: authUser?.id || '',
    name: `${authUser?.nombre || ''} ${authUser?.apellido || ''}`.trim() || 'Admin',
    type: 'admin',
    email: authUser?.email || '',
  }

  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all')
  const [page, setPage] = useState(1)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserPayload>(emptyCreate)
  const [editForm, setEditForm] = useState<UpdateUserPayload>({})
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserSummary | null>(null)
  const [correoLocal, setCorreoLocal] = useState('')
  const [rolesEdicion, setRolesEdicion] = useState<string[]>([])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { users: list } = await usersApi.list()
      setUsers(list)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { error?: string } } }).response?.data?.error)
          : 'No se pudo cargar el listado'
      setError(msg || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && !rolesDelUsuario(u).includes(roleFilter)) return false
      if (statusFilter === 'activo' && !u.activo) return false
      if (statusFilter === 'inactivo' && u.activo) return false
      if (!q) return true
      return `${u.email} ${u.nombre} ${u.apellido} ${rolesDelUsuario(u).join(' ')}`.toLowerCase().includes(q)
    })
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const openCreate = () => {
    setCreateForm(emptyCreate)
    setCorreoLocal('')
    setFormError(null)
    setModalMode('create')
  }

  const openEdit = (u: UserSummary) => {
    const roles = rolesDelUsuario(u)
    setEditingUser(u)
    setRolesEdicion(roles)
    setCorreoLocal(usuarioDeCorreo(u.email))
    setEditForm({
      email: u.email,
      nombre: u.nombre,
      apellido: u.apellido,
      tipo_usuario: u.tipo_usuario,
      activo: u.activo,
      password: '',
    })
    setFormError(null)
    setModalMode('edit')
  }

  const alternarRol = (rol: string) => {
    setRolesEdicion((actuales) =>
      actuales.includes(rol) ? actuales.filter((item) => item !== rol) : [...actuales, rol]
    )
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingUser(null)
    setFormError(null)
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    const email = armarCorreoInstitucional(correoLocal, createForm.tipo_usuario)
    if (!email) {
      setFormError('Escribe solo el usuario del correo, sin @ ni dominio')
      return
    }
    const passwordCheck = validatePasswordStrength(createForm.password)
    if (!passwordCheck.valid) {
      setFormError(passwordCheck.message)
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const created = (await usersApi.create({ ...createForm, email })) as { user?: { id: string }; id?: string }
      const createdId = created.user?.id || created.id || ''
      const decision = decidirAltaUsuario({ altaOk: true })
      setUsers((prev) =>
        aplicarAltaEnLista(
          prev,
          {
            id: createdId,
            email,
            nombre: createForm.nombre,
            apellido: createForm.apellido,
            tipo_usuario: createForm.tipo_usuario,
            activo: true,
          },
          true,
        ),
      )
      if (decision.cierraModal) closeModal()
    } catch (err: unknown) {
      const decision = decidirAltaUsuario({
        altaOk: false,
        error: getApiErrorMessage(err, 'Error al crear usuario'),
      })
      setFormError(decision.formError)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (rolesEdicion.length === 0) {
      setFormError('Selecciona al menos un rol')
      return
    }
    const email = armarCorreoInstitucional(correoLocal, rolesEdicion)
    if (!email) {
      setFormError('Escribe solo el usuario del correo, sin @ ni dominio')
      return
    }
    if (editForm.password && editForm.password.length > 0) {
      const passwordCheck = validatePasswordStrength(editForm.password)
      if (!passwordCheck.valid) {
        setFormError(passwordCheck.message)
        return
      }
    }
    const tipoVisible = rolesEdicion.includes(String(editForm.tipo_usuario || ''))
      ? String(editForm.tipo_usuario)
      : rolesEdicion[0]
    setSaving(true)
    setFormError(null)
    const camposVisibles: Partial<UsuarioLista> = {
      email,
      nombre: editForm.nombre,
      apellido: editForm.apellido,
      tipo_usuario: tipoVisible,
      activo: editForm.activo,
      roles: rolesEdicion,
    }
    try {
      const payload: UpdateUserPayload = { ...camposVisibles }
      if (editForm.password && editForm.password.length > 0) {
        payload.password = editForm.password
      }
      await usersApi.update(editingUser.id, payload)
      const decision = decidirCambioUsuario({ cambioOk: true })
      setUsers((prev) => aplicarCambioEnLista(prev, editingUser.id, camposVisibles, true))
      if (decision.cierraModal) closeModal()
    } catch (err: unknown) {
      const decision = decidirCambioUsuario({
        cambioOk: false,
        error: getApiErrorMessage(err, 'Error al actualizar'),
      })
      setFormError(decision.formError)
    } finally {
      setSaving(false)
    }
  }

  const confirmDeactivate = async () => {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    try {
      await usersApi.deactivate(targetId)
      decidirDesactivarUsuario({ desactivarOk: true })
      setUsers((prev) => aplicarDesactivarEnLista(prev, targetId, true))
      setDeleteTarget(null)
    } catch (err: unknown) {
      const decision = decidirDesactivarUsuario({
        desactivarOk: false,
        error: getApiErrorMessage(err, 'No se pudo desactivar el usuario'),
      })
      setError(decision.error)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0 pointer-events-none" />

      <div className="relative z-10">
        <Header user={headerUser} title="Gestión de Usuarios" subtitle="Administración del sistema" />

        <main className="max-w-6xl xl:max-w-[92rem] mx-auto p-6 lg:p-10 space-y-8">
          <Card className="bg-white shadow-md border border-gray-200 p-6 lg:p-10">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link to="/dashboard-admin" className="text-sm lg:text-base text-red-600 hover:underline">
                    ← Volver al panel
                  </Link>
                  <CardTitle className="text-2xl lg:text-3xl text-gray-900 mt-1">Usuarios del sistema</CardTitle>
                  <CardDescription className="text-base lg:text-lg">
                    {filtered.length} resultado(s) · página {currentPage} de {totalPages}
                  </CardDescription>
                </div>
                <Button onClick={openCreate} className="inline-flex items-center gap-2 lg:h-12 lg:px-6 lg:text-base">
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                  Agregar usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                <div className="relative md:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, email o rol…"
                    className="w-full pl-10 pr-3 py-2 lg:py-3 border border-gray-300 rounded-lg text-sm lg:text-base focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 lg:py-3 text-sm lg:text-base"
                >
                  <option value="all">Todos los roles</option>
                  {USER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 lg:py-3 text-sm lg:text-base"
                >
                  <option value="all">Todos los estados</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>

              {loading && <p className="text-gray-600">Cargando usuarios…</p>}
              {error && <p className="text-red-600">{error}</p>}

              {!loading && !error && (
                <>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm lg:text-base">
                        <thead className="bg-gray-100 text-left text-gray-700">
                          <tr>
                            <th className="px-4 py-3 lg:px-5 lg:py-4 font-medium">Email</th>
                            <th className="px-4 py-3 lg:px-5 lg:py-4 font-medium">Nombre</th>
                            <th className="px-4 py-3 lg:px-5 lg:py-4 font-medium">Roles</th>
                            <th className="px-4 py-3 lg:px-5 lg:py-4 font-medium">Estado</th>
                            <th className="px-4 py-3 lg:px-5 lg:py-4 font-medium text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((u) => (
                            <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 lg:px-5 lg:py-4">{u.email}</td>
                              <td className="px-4 py-3 lg:px-5 lg:py-4">
                                {u.nombre} {u.apellido}
                              </td>
                              <td className="px-4 py-3 lg:px-5 lg:py-4 capitalize">{rolesDelUsuario(u).join(', ')}</td>
                              <td className="px-4 py-3 lg:px-5 lg:py-4">
                                <Badge
                                  variant="outline"
                                  className={
                                    u.activo
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }
                                >
                                  {u.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 lg:px-5 lg:py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEdit(u)}
                                    className="inline-flex items-center gap-1"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                  </Button>
                                  {u.activo && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDeleteTarget(u)}
                                      className="inline-flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Desactivar
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {pageItems.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                No hay usuarios que coincidan con los filtros
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-sm lg:text-base text-gray-500">
                      Mostrando {(currentPage - 1) * PAGE_SIZE + (pageItems.length ? 1 : 0)}–
                      {(currentPage - 1) * PAGE_SIZE + pageItems.length} de {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm lg:text-base text-gray-700 min-w-[4rem] text-center">
                        {currentPage}/{totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modalMode === 'create' ? 'Agregar usuario' : 'Actualizar usuario'}
            </h2>

            {formError && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                {formError}
              </p>
            )}

            {modalMode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  label="Nombre"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  required
                />
                <Input
                  label="Apellido"
                  value={createForm.apellido}
                  onChange={(e) => setCreateForm({ ...createForm, apellido: e.target.value })}
                  required
                />
                <div>
                  <label htmlFor="correo-institucional" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo
                  </label>
                  <div className="flex items-stretch">
                    <input
                      id="correo-institucional"
                      value={correoLocal}
                      onChange={(e) => setCorreoLocal(usuarioDeCorreo(e.target.value))}
                      required
                      autoComplete="off"
                      placeholder="usuario"
                      className="min-w-0 flex-1 border border-gray-300 rounded-l-lg px-3 py-2 lg:py-3 text-sm lg:text-base outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-100 text-gray-700 text-sm lg:text-base select-none">
                      @{dominioCorreoPorTipo(createForm.tipo_usuario)}
                    </span>
                  </div>
                </div>
                <Input
                  label="Contraseña"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={8}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de usuario</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 lg:py-3 text-sm lg:text-base"
                    value={createForm.tipo_usuario}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, tipo_usuario: e.target.value })
                    }
                  >
                    {USER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando…' : 'Crear'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-3">
                <Input
                  label="Nombre"
                  value={editForm.nombre || ''}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  required
                />
                <Input
                  label="Apellido"
                  value={editForm.apellido || ''}
                  onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                  required
                />
                <div>
                  <label htmlFor="correo-edicion" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo
                  </label>
                  <div className="flex items-stretch">
                    <input
                      id="correo-edicion"
                      value={correoLocal}
                      onChange={(e) => setCorreoLocal(usuarioDeCorreo(e.target.value))}
                      required
                      autoComplete="off"
                      placeholder="usuario"
                      className="min-w-0 flex-1 border border-gray-300 rounded-l-lg px-3 py-2 lg:py-3 text-sm lg:text-base outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-100 text-gray-700 text-sm lg:text-base select-none">
                      @{dominioCorreoPorRoles(rolesEdicion)}
                    </span>
                  </div>
                </div>
                <Input
                  label="Nueva contraseña (opcional)"
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  minLength={8}
                />
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-2">Roles</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[...USER_TYPES, ...rolesEdicion.filter((rol) => !USER_TYPES.includes(rol as (typeof USER_TYPES)[number]))].map((rol) => (
                      <label key={rol} className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
                        <input
                          type="checkbox"
                          checked={rolesEdicion.includes(rol)}
                          onChange={() => alternarRol(rol)}
                        />
                        <span className="capitalize">{rol}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!editForm.activo}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                  />
                  Usuario activo
                </label>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando…' : 'Actualizar'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeactivate}
        title="Desactivar usuario"
        message={
          deleteTarget
            ? `¿Desactivar a ${deleteTarget.nombre} ${deleteTarget.apellido} (${deleteTarget.email})?`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
      />
    </div>
  )
}
