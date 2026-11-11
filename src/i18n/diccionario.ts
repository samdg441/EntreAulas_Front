/**
 * Textos de la interfaz en español (idioma base) e inglés.
 * Una clave por texto: el tipo `Clave` impide usar una que no exista, y la prueba
 * `i18n/diccionario.test.ts` comprueba que ninguna esté vacía o sin su par.
 * Los marcadores `{nombre}` se sustituyen al traducir.
 */
export const DICCIONARIO = {
  // ── Marca y estructura ────────────────────────────────────────────────
  'app.nombre': { es: 'EntreAulas', en: 'EntreAulas' },
  'app.universidad': { es: 'Universidad de Medellín', en: 'Universidad de Medellín' },
  'shell.saltar': { es: 'Saltar al contenido', en: 'Skip to content' },
  'shell.abrirMenu': { es: 'Abrir menú de navegación', en: 'Open navigation menu' },
  'shell.cerrarMenu': { es: 'Cerrar menú de navegación', en: 'Close navigation menu' },
  'shell.navegacion': { es: 'Navegación principal', en: 'Main navigation' },
  'shell.irInicio': { es: 'Ir al inicio', en: 'Go to home' },

  // ── Secciones de la barra lateral ─────────────────────────────────────
  'nav.sec.principal': { es: 'Principal', en: 'Main' },
  'nav.sec.evaluaciones': { es: 'Evaluaciones', en: 'Evaluations' },
  'nav.sec.docentes': { es: 'Docentes', en: 'Teachers' },
  'nav.sec.encuestas': { es: 'Encuestas', en: 'Surveys' },
  'nav.sec.reportes': { es: 'Reportes y resultados', en: 'Reports and results' },
  'nav.sec.control': { es: 'Control', en: 'Oversight' },
  'nav.sec.academico': { es: 'Gestión académica', en: 'Academic management' },
  'nav.sec.administracion': { es: 'Administración', en: 'Administration' },
  'nav.sec.cuenta': { es: 'Mi cuenta', en: 'My account' },

  // ── Enlaces de la barra lateral ───────────────────────────────────────
  'nav.inicio': { es: 'Inicio', en: 'Home' },
  'nav.evaluar': { es: 'Evaluar docentes', en: 'Evaluate teachers' },
  'nav.perfil': { es: 'Mi perfil', en: 'My profile' },
  'nav.gestionarProfesores': { es: 'Gestión de profesores', en: 'Teacher management' },
  'nav.programarEncuestas': { es: 'Programar encuestas', en: 'Schedule surveys' },
  'nav.reportesGenerales': { es: 'Reportes generales', en: 'General reports' },
  'nav.resultadosEncuestas': { es: 'Resultados de encuestas', en: 'Survey results' },
  'nav.auditoria': { es: 'Auditoría', en: 'Audit log' },
  'nav.materias': { es: 'Materias de la carrera', en: 'Degree subjects' },
  'nav.profesores': { es: 'Profesores', en: 'Teachers' },
  'nav.resultadosCarrera': { es: 'Resultados de la carrera', en: 'Degree results' },
  'nav.usuarios': { es: 'Usuarios', en: 'Users' },
  'nav.academico': { es: 'Estructura académica', en: 'Academic structure' },
  'nav.qr': { es: 'Códigos QR', en: 'QR codes' },
  'nav.encuestasAdmin': { es: 'Encuestas', en: 'Surveys' },
  'nav.misEncuestas': { es: 'Encuesta de mis grupos', en: 'Survey for my groups' },

  // ── Roles ─────────────────────────────────────────────────────────────
  'rol.estudiante': { es: 'Estudiante', en: 'Student' },
  'rol.profesor': { es: 'Docente', en: 'Teacher' },
  'rol.coordinador': { es: 'Coordinador', en: 'Coordinator' },
  'rol.decano': { es: 'Decano', en: 'Dean' },
  'rol.admin': { es: 'Administrador', en: 'Administrator' },

  // ── Preferencias de visualización ─────────────────────────────────────
  'pref.abrir': { es: 'Preferencias de visualización', en: 'Display preferences' },
  'pref.titulo': { es: 'Preferencias de visualización', en: 'Display preferences' },
  'pref.apariencia': { es: 'Apariencia', en: 'Appearance' },
  'pref.claro': { es: 'Claro', en: 'Light' },
  'pref.oscuro': { es: 'Noche', en: 'Dark' },
  'pref.sistema': { es: 'Automático', en: 'Automatic' },
  'pref.idioma': { es: 'Idioma', en: 'Language' },
  'pref.es': { es: 'Español', en: 'Spanish' },
  'pref.en': { es: 'Inglés', en: 'English' },
  'pref.tamano': { es: 'Tamaño de texto', en: 'Text size' },
  'pref.small': { es: 'Pequeño', en: 'Small' },
  'pref.standard': { es: 'Estándar', en: 'Standard' },
  'pref.large': { es: 'Grande', en: 'Large' },
  'pref.xlarge': { es: 'Muy grande', en: 'Extra large' },
  'pref.ayuda': { es: 'Se guardan en este navegador.', en: 'Saved in this browser.' },
  'pref.cerrar': { es: 'Cerrar preferencias', en: 'Close preferences' },

  // ── Comunes ───────────────────────────────────────────────────────────
  'com.cargando': { es: 'Cargando…', en: 'Loading…' },
  'com.error': { es: 'No pudimos cargar la información. Intenta de nuevo.', en: 'We could not load the data. Please try again.' },
  'com.reintentar': { es: 'Reintentar', en: 'Retry' },
  'com.volver': { es: 'Volver', en: 'Back' },
  'com.volverInicio': { es: 'Volver al inicio', en: 'Back to home' },
  'com.limpiar': { es: 'Limpiar filtros', en: 'Clear filters' },
  'com.anterior': { es: 'Anterior', en: 'Previous' },
  'com.siguiente': { es: 'Siguiente', en: 'Next' },
  'com.pagina': { es: 'Página {pagina} de {total}', en: 'Page {pagina} of {total}' },
  'com.mostrando': { es: 'Mostrando {desde}–{hasta} de {total}', en: 'Showing {desde}–{hasta} of {total}' },
  'com.sinCorreo': { es: 'Sin correo registrado', en: 'No email on file' },

  // ── Dashboard del coordinador ─────────────────────────────────────────
  'coord.titulo': { es: 'Panel de coordinación', en: 'Coordination dashboard' },
  'coord.subtitulo': {
    es: 'Seguimiento de los docentes y de las evaluaciones de tu carrera.',
    en: 'Follow the teachers and evaluations of your degree.',
  },
  'coord.saludo.manana': { es: 'Buenos días', en: 'Good morning' },
  'coord.saludo.tarde': { es: 'Buenas tardes', en: 'Good afternoon' },
  'coord.saludo.noche': { es: 'Buenas noches', en: 'Good evening' },
  'coord.saludo': { es: '{saludo}, {nombre}', en: '{saludo}, {nombre}' },
  'coord.guia.titulo': { es: 'Cómo empezar', en: 'How to get started' },
  'coord.guia.p1': { es: 'Revisa los docentes en atención (promedio inferior a 4.0).', en: 'Review the teachers who need attention (average below 4.0).' },
  'coord.guia.p2': { es: 'Programa la encuesta: periodo, fechas y cursos.', en: 'Schedule the survey: term, dates and courses.' },
  'coord.guia.p3': { es: 'Genera los códigos QR y avisa a los grupos.', en: 'Generate the QR codes and notify the groups.' },
  'coord.metricas': { es: 'Indicadores de la carrera', en: 'Degree indicators' },
  'coord.m.profesores': { es: 'Profesores', en: 'Teachers' },
  'coord.m.profesoresDesc': { es: 'Activos en tu carrera', en: 'Active in your degree' },
  'coord.m.profesoresAyuda': {
    es: 'Docentes activos vinculados a tu carrera. No incluye docentes de otras carreras de la facultad.',
    en: 'Active teachers linked to your degree. Teachers from other degrees in the faculty are not included.',
  },
  'coord.m.cursos': { es: 'Cursos activos', en: 'Active courses' },
  'coord.m.cursosDesc': { es: 'Con grupos abiertos', en: 'With open groups' },
  'coord.m.cursosAyuda': {
    es: 'Asignaturas con grupos abiertos en tu carrera. Sirve para estimar cuántas encuestas puedes programar en el periodo.',
    en: 'Subjects with open groups in your degree. Use it to estimate how many surveys you can schedule this term.',
  },
  'coord.m.promedio': { es: 'Promedio general', en: 'Overall average' },
  'coord.m.promedioDesc': { es: 'En una escala de 1.0 a 5.0', en: 'On a 1.0 to 5.0 scale' },
  'coord.m.promedioRiesgo': { es: 'Por debajo de 4.0: carrera en seguimiento', en: 'Below 4.0: degree under review' },
  'coord.m.promedioAyuda': {
    es: 'Promedio de las evaluaciones de tu carrera en escala de 1.0 a 5.0. Si baja de 4.0, la carrera entra en seguimiento.',
    en: 'Average of your degree’s evaluations on a 1.0 to 5.0 scale. Below 4.0 the degree goes under review.',
  },
  'coord.m.umbral': { es: 'Umbral 4.0', en: 'Threshold 4.0' },
  'coord.m.riesgo': { es: 'Docentes en riesgo', en: 'Teachers at risk' },
  'coord.m.riesgoDesc': { es: 'Promedio inferior a 4.0', en: 'Average below 4.0' },
  'coord.m.riesgoAyuda': {
    es: 'Docente con calificación promedio inferior a 4.0/5.0 en el periodo activo. Requiere seguimiento pedagógico o revisión de comentarios.',
    en: 'Teacher with an average below 4.0/5.0 in the active term. Needs pedagogical follow-up or a review of student comments.',
  },
  'coord.t.titulo': { es: 'Resumen de docentes', en: 'Teacher overview' },
  'coord.t.descripcion': {
    es: 'Docentes de tu carrera. Los promedios menores a 4.0 aparecen resaltados.',
    en: 'Teachers in your degree. Averages below 4.0 are highlighted.',
  },
  'coord.t.buscar': { es: 'Buscar por nombre o correo', en: 'Search by name or email' },
  'coord.t.docente': { es: 'Docente', en: 'Teacher' },
  'coord.t.correo': { es: 'Correo', en: 'Email' },
  'coord.t.evaluaciones': { es: 'Evaluaciones', en: 'Evaluations' },
  'coord.t.promedio': { es: 'Promedio', en: 'Average' },
  'coord.t.vacia': { es: 'No encontramos docentes con ese filtro.', en: 'No teachers match that filter.' },
  'coord.t.sinDatos': { es: 'Sin datos', en: 'No data' },
  'coord.t.enRiesgo': { es: 'En riesgo', en: 'At risk' },
  'coord.t.verDetalle': { es: 'Ver detalle', en: 'View details' },

  // ── Calendario de evaluaciones ────────────────────────────────────────
  'cal.titulo': { es: 'Calendario de evaluaciones', en: 'Evaluation calendar' },
  'cal.hoy': { es: 'Hoy', en: 'Today' },
  'cal.mesAnterior': { es: 'Mes anterior', en: 'Previous month' },
  'cal.mesSiguiente': { es: 'Mes siguiente', en: 'Next month' },
  'cal.dias': { es: 'Días de {mes}', en: 'Days of {mes}' },
  'cal.cargando': { es: 'Cargando fechas…', en: 'Loading dates…' },
  'cal.error': { es: 'No pudimos cargar las fechas de evaluación.', en: 'We could not load the evaluation dates.' },
  'cal.ninguna': { es: 'No hay evaluaciones programadas.', en: 'No evaluations are scheduled.' },
  'cal.ningunaAyuda': { es: 'Programa un periodo para verlo aquí.', en: 'Schedule a term to see it here.' },
  'cal.abierta': { es: 'Evaluación abierta', en: 'Evaluation open' },
  'cal.proxima': { es: 'Próxima evaluación', en: 'Next evaluation' },
  'cal.proximasFechas': { es: 'Próximas fechas', en: 'Upcoming dates' },
  'cal.periodo': { es: 'Periodo {periodo}', en: 'Term {periodo}' },
  'cal.rango': { es: 'Del {inicio} al {fin}', en: 'From {inicio} to {fin}' },
  'cal.cierra': { es: 'Cierra {cuando}', en: 'Closes {cuando}' },
  'cal.abre': { es: 'Abre {cuando}', en: 'Opens {cuando}' },
  'cal.cerrada': { es: 'Cerrada', en: 'Closed' },
  'cal.dia.inicio': { es: 'apertura de la evaluación', en: 'evaluation opens' },
  'cal.dia.fin': { es: 'cierre de la evaluación', en: 'evaluation closes' },
  'cal.dia.abierta': { es: 'evaluación abierta', en: 'evaluation open' },
  'cal.dia.normal': { es: 'sin evaluación', en: 'no evaluation' },
  'cal.leyenda.limites': { es: 'Apertura y cierre', en: 'Opens and closes' },
  'cal.leyenda.abierta': { es: 'Evaluación abierta', en: 'Evaluation open' },
  'cal.leyenda.hoy': { es: 'Hoy', en: 'Today' },
  'cal.cuando.hoy': { es: 'hoy', en: 'today' },
  'cal.cuando.manana': { es: 'mañana', en: 'tomorrow' },
  'cal.cuando.dias': { es: 'en {n} días', en: 'in {n} days' },

  // ── Gestión de profesores ─────────────────────────────────────────────
  'gp.titulo': { es: 'Gestión de profesores', en: 'Teacher management' },
  'gp.subtitulo': {
    es: 'Consulta el desempeño de cada docente de tu carrera.',
    en: 'Review how each teacher in your degree is doing.',
  },
  'gp.buscar': { es: 'Buscar por nombre o correo', en: 'Search by name or email' },
  'gp.filtro': { es: 'Mostrar', en: 'Show' },
  'gp.f.todos': { es: 'Todos', en: 'All' },
  'gp.f.riesgo': { es: 'En riesgo', en: 'At risk' },
  'gp.f.ok': { es: 'Con buen promedio', en: 'On track' },
  'gp.f.sinDatos': { es: 'Sin evaluaciones', en: 'No evaluations' },
  'gp.orden': { es: 'Ordenar por', en: 'Sort by' },
  'gp.o.nombre': { es: 'Nombre', en: 'Name' },
  'gp.o.promedioAsc': { es: 'Promedio (menor primero)', en: 'Average (lowest first)' },
  'gp.o.promedioDesc': { es: 'Promedio (mayor primero)', en: 'Average (highest first)' },
  'gp.o.evaluaciones': { es: 'Más evaluaciones', en: 'Most evaluations' },
  'gp.lista': { es: 'Docentes', en: 'Teachers' },
  'gp.encontrados': { es: '{n} docentes', en: '{n} teachers' },
  'gp.encontrado': { es: '1 docente', en: '1 teacher' },
  'gp.sinResultados': { es: 'Ningún docente coincide con tu búsqueda.', en: 'No teacher matches your search.' },
  'gp.sinResultadosAyuda': { es: 'Prueba con otro nombre o quita los filtros.', en: 'Try another name or clear the filters.' },
  'gp.cargando': { es: 'Cargando docentes…', en: 'Loading teachers…' },
  'gp.seleccionar': { es: 'Selecciona un docente', en: 'Select a teacher' },
  'gp.seleccionarAyuda': {
    es: 'Elige un docente de la lista para ver su desempeño por categoría y por curso.',
    en: 'Pick a teacher from the list to see performance by category and course.',
  },
  'gp.periodo': { es: 'Periodo', en: 'Term' },
  'gp.evaluaciones': { es: 'Evaluaciones', en: 'Evaluations' },
  'gp.promedio': { es: 'Promedio', en: 'Average' },
  'gp.evaluadores': { es: 'Estudiantes que evaluaron', en: 'Students who evaluated' },
  'gp.cursosEvaluados': { es: 'Cursos evaluados', en: 'Courses evaluated' },
  'gp.porCategoria': { es: 'Promedio por categoría', en: 'Average by category' },
  'gp.porCurso': { es: 'Cursos evaluados', en: 'Courses evaluated' },
  'gp.sinCategorias': { es: 'No hay datos por categoría en este periodo.', en: 'No category data for this term.' },
  'gp.sinCursos': { es: 'No hay cursos evaluados en este periodo.', en: 'No evaluated courses for this term.' },
  'gp.errorStats': { es: 'No pudimos cargar las estadísticas de este docente.', en: 'We could not load this teacher’s statistics.' },
  'gp.cargandoStats': { es: 'Cargando estadísticas…', en: 'Loading statistics…' },
  'gp.evaluacionesN': { es: '{n} evaluaciones', en: '{n} evaluations' },
  'gp.promedioN': { es: 'Prom. {n}', en: 'Avg. {n}' },
  'gp.riesgoAviso': { es: 'Promedio inferior a 4.0: conviene revisar los comentarios.', en: 'Average below 4.0: review the comments.' },
  'gp.volverLista': { es: 'Volver a la lista', en: 'Back to the list' },

  // ── Auditoría ─────────────────────────────────────────────────────────
  'au.titulo': { es: 'Auditoría de la carrera', en: 'Degree audit log' },
  'au.subtitulo': {
    es: 'Quién hizo qué en tu carrera: programación de encuestas, códigos QR y consultas de reportes.',
    en: 'Who did what in your degree: survey scheduling, QR codes and report lookups.',
  },
  'au.total': { es: 'Eventos registrados', en: 'Recorded events' },
  'au.ultimo': { es: 'Último evento', en: 'Latest event' },
  'au.ninguno': { es: 'Sin eventos', en: 'No events' },
  'au.filtros': { es: 'Filtros', en: 'Filters' },
  'au.accion': { es: 'Acción', en: 'Action' },
  'au.todas': { es: 'Todas las acciones', en: 'All actions' },
  'au.desde': { es: 'Desde', en: 'From' },
  'au.hasta': { es: 'Hasta', en: 'To' },
  'au.buscar': { es: 'Buscar por persona o detalle', en: 'Search by person or detail' },
  'au.a.programar_encuesta': { es: 'Programó una encuesta', en: 'Scheduled a survey' },
  'au.a.generar_qr': { es: 'Generó códigos QR', en: 'Generated QR codes' },
  'au.a.consultar_reportes': { es: 'Consultó reportes', en: 'Viewed reports' },
  'au.a.consultar_docente': { es: 'Consultó un docente', en: 'Viewed a teacher' },
  'au.cuando': { es: 'Fecha y hora', en: 'Date and time' },
  'au.quien': { es: 'Persona', en: 'Person' },
  'au.detalle': { es: 'Detalle', en: 'Detail' },
  'au.vacia': { es: 'No hay eventos con esos filtros.', en: 'No events match those filters.' },
  'au.vaciaAyuda': {
    es: 'Los eventos aparecen cuando alguien programa una encuesta, genera QR o consulta reportes.',
    en: 'Events appear when someone schedules a survey, generates QR codes or opens reports.',
  },
  'au.noDisponible': { es: 'La auditoría aún no está activa', en: 'The audit log is not active yet' },
  'au.noDisponibleAyuda': {
    es: 'Falta completar la configuración del registro de eventos. Avisa al administrador del sistema.',
    en: 'The event log setup is not finished yet. Let the system administrator know.',
  },
  'au.exportar': { es: 'Exportar CSV', en: 'Export CSV' },
  'au.error': { es: 'No pudimos cargar la auditoría.', en: 'We could not load the audit log.' },
  'au.fechaInvalida': { es: 'La fecha inicial no puede ser posterior a la final.', en: 'The start date cannot be after the end date.' },
  'au.resumenAcciones': { es: 'Eventos por acción', en: 'Events by action' },
} as const

export type Clave = keyof typeof DICCIONARIO

export const existeClave = (clave: string): clave is Clave => clave in DICCIONARIO
export type IdiomaDic = 'es' | 'en'

/** Devuelve el texto en el idioma pedido (con el español de respaldo) y sustituye `{marcadores}`. */
export function traducir(idioma: IdiomaDic, clave: Clave, valores?: Record<string, string | number>): string {
  const entrada = DICCIONARIO[clave]
  const plantilla = entrada?.[idioma] || entrada?.es || clave
  if (!valores) return plantilla
  return plantilla.replace(/\{(\w+)\}/g, (marcador, nombre: string) =>
    nombre in valores ? String(valores[nombre]) : marcador
  )
}
