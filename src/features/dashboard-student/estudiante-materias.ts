export type MateriaMatriculadaVista = {
  id: string | number
  codigo: string
  nombre: string
  grupo: string
  profesor: string
  periodo: string
  horario: string
  aula: string
}

export const MATERIAS_VACIAS = {
  materiasMatriculadas: [] as unknown[],
  total: 0,
}

export function decidirCargaMaterias(params: {
  haySesion: boolean
  type?: string
  materiasOk?: boolean
}): 'login' | 'no-cargar' | 'vacias' | 'pintar' {
  if (!params.haySesion) return 'login'
  if (params.type !== 'student') return 'no-cargar'
  if (!params.materiasOk) return 'vacias'
  return 'pintar'
}

export function materiasTrasErrorApi() {
  return { ...MATERIAS_VACIAS }
}

export function materiasDesdeApi(
  data: { materiasMatriculadas?: unknown; total?: number | string | null } | null
) {
  const lista = Array.isArray(data?.materiasMatriculadas) ? data.materiasMatriculadas : []
  return {
    materiasMatriculadas: lista,
    total: Number(data?.total ?? lista.length) || lista.length,
  }
}

export function filasVistaMaterias(materias: unknown[]): MateriaMatriculadaVista[] {
  return materias
    .map((item) => filaVistaMateria(item))
    .filter((fila): fila is MateriaMatriculadaVista => fila !== null)
}

function filaVistaMateria(item: unknown): MateriaMatriculadaVista | null {
  if (!item || typeof item !== 'object') return null
  const fila = item as Record<string, unknown>
  const grupo = asRecord(fila.grupo)
  const curso = asRecord(grupo?.curso)
  if (!curso) return null
  const profesor = asRecord(grupo?.profesor)
  const periodo = asRecord(grupo?.periodo)
  const id = fila.id ?? curso.id
  if (id == null) return null
  return {
    id: id as string | number,
    codigo: texto(curso.codigo) || 'Sin código',
    nombre: texto(curso.nombre) || 'Materia sin nombre',
    grupo: etiquetaGrupo(grupo?.numeroGrupo),
    profesor: texto(profesor?.nombre) || 'Profesor por asignar',
    periodo: texto(periodo?.codigo) || texto(periodo?.nombre) || 'Periodo no informado',
    horario: texto(grupo?.horario) || 'Horario no informado',
    aula: texto(grupo?.aula) || 'Aula no informada',
  }
}

function asRecord(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  return valor as Record<string, unknown>
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function textoEscalar(valor: unknown): string {
  if (typeof valor === 'string') return valor.trim()
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor)
  return ''
}

function etiquetaGrupo(numeroGrupo: unknown): string {
  const numero = textoEscalar(numeroGrupo)
  if (!numero) return 'Sin grupo'
  return `Grupo ${numero}`
}
