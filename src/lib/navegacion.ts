import type { Clave } from '../i18n/diccionario'

/** Modelo de la barra lateral: secciones por tipo de ruta y por rol. Lógica pura. */

export type RolNav = 'estudiante' | 'profesor' | 'coordinador' | 'decano' | 'admin'
export type IconoNav =
  | 'inicio'
  | 'evaluar'
  | 'perfil'
  | 'docentes'
  | 'encuestas'
  | 'programar'
  | 'reportes'
  | 'resultados'
  | 'auditoria'
  | 'materias'
  | 'usuarios'
  | 'academico'
  | 'qr'

export interface EnlaceNav {
  clave: Clave
  ruta: string
  icono: IconoNav
}

export interface SeccionNav {
  clave: Clave
  enlaces: EnlaceNav[]
}

const CUENTA: SeccionNav = {
  clave: 'nav.sec.cuenta',
  enlaces: [{ clave: 'nav.perfil', ruta: '/profile', icono: 'perfil' }],
}

function sec(clave: Clave, ...enlaces: EnlaceNav[]): SeccionNav {
  return { clave, enlaces }
}

function ir(clave: Clave, ruta: string, icono: IconoNav): EnlaceNav {
  return { clave, ruta, icono }
}

const NAVEGACION: Record<RolNav, SeccionNav[]> = {
  estudiante: [
    { clave: 'nav.sec.principal', enlaces: [{ clave: 'nav.inicio', ruta: '/dashboard-estudiante', icono: 'inicio' }] },
    {
      clave: 'nav.sec.evaluaciones',
      enlaces: [{ clave: 'nav.evaluar', ruta: '/evaluate/selection', icono: 'evaluar' }],
    },
    CUENTA,
  ],
  profesor: [
    { clave: 'nav.sec.principal', enlaces: [{ clave: 'nav.inicio', ruta: '/dashboard-profesor', icono: 'inicio' }] },
    {
      clave: 'nav.sec.reportes',
      enlaces: [
        { clave: 'nav.resultadosEncuestas', ruta: '/reports/survey-results', icono: 'resultados' },
        { clave: 'nav.reportesGenerales', ruta: '/reports', icono: 'reportes' },
        { clave: 'nav.misEncuestas', ruta: '/survey', icono: 'encuestas' },
      ],
    },
    CUENTA,
  ],
  coordinador: [
    { clave: 'nav.sec.principal', enlaces: [{ clave: 'nav.inicio', ruta: '/dashboard-coordinador', icono: 'inicio' }] },
    {
      clave: 'nav.sec.docentes',
      enlaces: [{ clave: 'nav.gestionarProfesores', ruta: '/profesores/gestionar', icono: 'docentes' }],
    },
    {
      clave: 'nav.sec.encuestas',
      enlaces: [{ clave: 'nav.programarEncuestas', ruta: '/surveys/schedule', icono: 'programar' }],
    },
    {
      clave: 'nav.sec.reportes',
      enlaces: [
        { clave: 'nav.reportesGenerales', ruta: '/reports', icono: 'reportes' },
        { clave: 'nav.resultadosEncuestas', ruta: '/reports/survey-results', icono: 'resultados' },
      ],
    },
    { clave: 'nav.sec.control', enlaces: [{ clave: 'nav.auditoria', ruta: '/auditoria', icono: 'auditoria' }] },
    CUENTA,
  ],
  decano: [
    { clave: 'nav.sec.principal', enlaces: [{ clave: 'nav.inicio', ruta: '/dashboard-decano', icono: 'inicio' }] },
    {
      clave: 'nav.sec.academico',
      enlaces: [
        { clave: 'nav.materias', ruta: '/career-subjects', icono: 'materias' },
        { clave: 'nav.profesores', ruta: '/professors', icono: 'docentes' },
      ],
    },
    {
      clave: 'nav.sec.reportes',
      enlaces: [
        { clave: 'nav.resultadosCarrera', ruta: '/career-results', icono: 'resultados' },
        { clave: 'nav.reportesGenerales', ruta: '/reports', icono: 'reportes' },
      ],
    },
    CUENTA,
  ],
  admin: [
    sec('nav.sec.principal', ir('nav.inicio', '/dashboard-admin', 'inicio')),
    sec(
      'nav.sec.administracion',
      ir('nav.usuarios', '/admin/users', 'usuarios'),
      ir('nav.academico', '/admin/academic', 'academico'),
      ir('nav.qr', '/admin/qr', 'qr'),
    ),
    sec(
      'nav.sec.encuestas',
      ir('nav.encuestasAdmin', '/admin/surveys', 'encuestas'),
      ir('nav.programarEncuestas', '/surveys/schedule', 'programar'),
    ),
    sec('nav.sec.reportes', ir('nav.reportesGenerales', '/reports', 'reportes')),
    CUENTA,
  ],
}

export function seccionesPorRol(rol: RolNav): SeccionNav[] {
  return NAVEGACION[rol]
}

const SINONIMOS: Record<string, RolNav> = {
  estudiante: 'estudiante',
  student: 'estudiante',
  profesor: 'profesor',
  docente: 'profesor',
  teacher: 'profesor',
  coordinador: 'coordinador',
  coordinator: 'coordinador',
  decano: 'decano',
  dean: 'decano',
  admin: 'admin',
  administrator: 'admin',
}
const PRIORIDAD: RolNav[] = ['admin', 'decano', 'coordinador', 'profesor', 'estudiante']

/** Rol con el que se arma el menú: el elegido en la sesión, si no el de mayor jerarquía de la cuenta. */
export function rolDeNavegacion(u: { selected_role?: string; roles?: string[]; tipo_usuario?: string } | null | undefined): RolNav {
  const elegido = SINONIMOS[(u?.selected_role || '').toLowerCase()]
  if (elegido) return elegido
  const delasCuenta = new Set((u?.roles ?? []).map((r) => SINONIMOS[r.toLowerCase()]).filter(Boolean))
  const porJerarquia = PRIORIDAD.find((r) => delasCuenta.has(r))
  if (porJerarquia) return porJerarquia
  return SINONIMOS[(u?.tipo_usuario || '').toLowerCase()] ?? 'estudiante'
}

/** Ruta del menú que corresponde a la URL actual: la coincidencia de prefijo más larga. */
export function rutaActiva(secciones: SeccionNav[], rutaActual: string): string | null {
  let mejor: string | null = null
  for (const { ruta } of secciones.flatMap((s) => s.enlaces)) {
    const coincide = rutaActual === ruta || rutaActual.startsWith(`${ruta}/`)
    if (coincide && (!mejor || ruta.length > mejor.length)) mejor = ruta
  }
  return mejor
}

/** Rutas donde no se muestra la barra lateral: acceso, entrada por QR, despedida y errores.
   Responder la encuesta (/evaluate/form) sí lleva barra y el control de tono. */
const SIN_BARRA = ['/login', '/forgot-password', '/reset-password', '/forbidden', '/qr-evaluacion', '/evaluate/goodbye']
export function mostrarBarraLateral(ruta: string): boolean {
  return !SIN_BARRA.some((r) => ruta === r || ruta.startsWith(`${r}/`))
}
