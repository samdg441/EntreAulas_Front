import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Card, {
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from '../../components/Card';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { User } from '../../types';
import {
  Calendar as CalendarIcon,
  ClipboardCheck,
  Star,
  BookOpen,
  Users,
  BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchStudentStats, fetchStudentEnrolledSubjects } from '../../api/teachers';
import { filasVistaMaterias, materiasDesdeApi, MateriaMatriculadaVista } from './estudiante-materias';
import Calendar from '../../components/Calendar';
import EmptyState from '../../components/EmptyState';
import OnboardingBanner from '../../components/OnboardingBanner';
import HelpTooltip from '../../components/HelpTooltip';

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href;

interface DashboardProps {
  user: User;
  onViewReports?: () => void;
}

type StudentStats = {
  evaluacionesCompletadas: number;
  evaluacionesPendientes: number;
  materiasMatriculadas: number;
  promedioGeneral: number;
  progresoGeneral: number;
};

type QuickAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  ayuda: string;
  onClick: () => void;
  variant: 'default' | 'outline';
  className: string;
};

type UserDashboardData = {
  stats: Record<string, unknown>;
  quickActions: QuickAction[];
};

type DashboardActions = {
  onStartEvaluation: () => void;
  onViewReports: () => void;
  onViewSurvey: () => void;
  onToggleCalendar: () => void;
};

const EMPTY_STUDENT_STATS: StudentStats = {
  evaluacionesCompletadas: 0,
  evaluacionesPendientes: 0,
  materiasMatriculadas: 0,
  promedioGeneral: 0,
  progresoGeneral: 0,
};

const FALLBACK_USER: User = { id: '', name: 'Usuario', type: 'student', email: '' };

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function normalizeUserType(tipo: string | undefined): User['type'] {
  const t = (tipo || '').toLowerCase();
  if (t === 'estudiante') return 'student';
  if (t === 'profesor' || t === 'docente') return 'teacher';
  if (t === 'coordinador') return 'coordinator';
  if (t === 'admin') return 'decano';
  return 'student';
}

function textoEstadistica(valor: unknown): string {
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor);
  return '';
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const nombre = textoEstadistica(parsed.nombre);
    const apellido = textoEstadistica(parsed.apellido);
    return {
      id: textoEstadistica(parsed.id),
      name: `${nombre} ${apellido}`.trim(),
      type: normalizeUserType(textoEstadistica(parsed.tipo_usuario)),
      email: textoEstadistica(parsed.email),
    };
  } catch {
    return null;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días';
  if (hour < 18) return '¡Buenas tardes';
  return '¡Buenas noches';
}

function getPrimaryStat(type: User['type'], stats: Record<string, unknown>) {
  if (type === 'teacher') {
    return {
      title: 'Calificación Promedio',
      value: stats.averageRating,
      suffix: '/5.0',
      description: 'Última evaluación',
      help: 'Promedio de las respuestas recibidas, en escala de 1.0 a 5.0. Por debajo de 4.0 conviene revisar comentarios y la tendencia del periodo.',
      valueClass: 'text-yellow-600',
      Icon: Star,
      iconClass: 'h-6 w-6 text-yellow-600 ml-4',
    };
  }
  if (type === 'coordinator') {
    return {
      title: 'Total de Profesores',
      value: stats.totalTeachers,
      suffix: '',
      description: 'En el departamento',
      help: 'Docentes activos de tu carrera. No incluye docentes de otros programas.',
      valueClass: 'text-red-600',
      Icon: Users,
      iconClass: 'h-6 w-6 text-red-600 ml-4',
    };
  }
  return {
    title: 'Evaluaciones Pendientes',
    value: stats.evaluationsPending,
    suffix: '',
    description: 'Deben completarse pronto',
    help: 'Materias del periodo vigente que aún no evalúas. Si el número es alto y la ventana está por cerrar, complétalas antes de la fecha límite.',
    valueClass: 'text-red-600',
    Icon: ClipboardCheck,
    iconClass: 'h-6 w-6 text-red-600 ml-4',
  };
}

function getSecondaryStat(type: User['type'], stats: Record<string, unknown>) {
  if (type === 'teacher') {
    return {
      title: 'Total Evaluaciones',
      value: stats.totalEvaluations,
      description: 'Evaluaciones recibidas',
      help: 'Cantidad de encuestas completadas. Un número bajo con muchos estudiantes matriculados indica poca participación, no una mala calificación.',
    };
  }
  if (type === 'student') {
    return {
      title: 'Evaluaciones Completadas',
      value: stats.evaluationsCompleted,
      description: 'Este período académico',
      help: 'Encuestas que ya enviaste en este periodo. Cada materia cuenta una sola vez.',
    };
  }
  return {
    title: 'Evaluaciones Completadas',
    value: stats.evaluationsCompleted,
    description: 'En el sistema',
    help: 'Encuestas cerradas en el periodo. Sirve para ver cuánta participación ya se registró.',
  };
}

function getTertiaryStat(type: User['type'], stats: Record<string, unknown>) {
  if (type === 'teacher') {
    return {
      title: 'Cursos Impartidos',
      value: stats.coursesTeaching,
      description: 'Este semestre',
      help: 'Asignaturas que impartes en el semestre. No mide calificaciones: solo tu carga docente.',
    };
  }
  if (type === 'coordinator') {
    return {
      title: 'Cursos Matriculados',
      value: stats.pendingApprovals,
      description: 'Por revisar',
      help: 'Cursos de la carrera que aún requieren revisión de su ventana de evaluación.',
    };
  }
  return {
    title: 'Cursos Matriculados',
    value: stats.currentCourses,
    description: 'Este semestre',
    help: 'Asignaturas en las que estás inscrito. Solo estas aparecen para evaluar, en las fechas vigentes o con el QR de la clase.',
  };
}

function buildStudentData(stats: StudentStats, actions: DashboardActions): UserDashboardData {
  return {
    stats: {
      evaluationsPending: stats.evaluacionesPendientes,
      evaluationsCompleted: stats.evaluacionesCompletadas,
      currentCourses: stats.materiasMatriculadas,
      averageGrade: stats.promedioGeneral,
    },
    quickActions: [
      {
        icon: ClipboardCheck,
        label: 'Nueva Evaluación',
        description: 'Evaluar un docente',
        ayuda: 'Abre la selección de docente, materia y grupo para responder la encuesta vigente del periodo.',
        onClick: actions.onStartEvaluation,
        variant: 'default',
        className: 'bg-red-600 hover:bg-red-700 text-white',
      },
      {
        icon: CalendarIcon,
        label: 'Ver Calendario',
        description: 'Fechas importantes',
        ayuda: 'Abre el calendario con la apertura y el cierre de las evaluaciones de tus materias.',
        onClick: actions.onToggleCalendar,
        variant: 'outline',
        className: 'border-gray-300',
      },
    ],
  };
}

function buildTeacherData(actions: DashboardActions): UserDashboardData {
  return {
    stats: {
      averageRating: 4.7,
      totalEvaluations: 45,
      coursesTeaching: 4,
      pendingReviews: 5,
    },
    quickActions: [
      {
        icon: BarChart3,
        label: 'Análisis y Reportes',
        description: 'Ver mis estadísticas',
        ayuda: 'Abre el análisis de calificaciones y comentarios del periodo.',
        onClick: actions.onViewReports,
        variant: 'default',
        className: 'bg-red-600 hover:bg-red-650 text-white',
      },
      {
        icon: ClipboardCheck,
        label: 'Ver Encuesta',
        description: 'Ver la encuesta de mi carrera',
        ayuda: 'Muestra las preguntas que responden los estudiantes de tu carrera.',
        onClick: actions.onViewSurvey,
        variant: 'outline',
        className: 'border-gray-300',
      },
    ],
  };
}

function buildCoordinatorData(actions: DashboardActions): UserDashboardData {
  return {
    stats: {
      totalTeachers: 24,
      evaluationsCompleted: 180,
      averageRating: 4.5,
      pendingApprovals: 3,
    },
    quickActions: [
      {
        icon: CalendarIcon,
        label: 'Calendario de evaluaciones',
        description: 'Ver cuándo abren y cierran las encuestas',
        ayuda: 'Abre el calendario con las ventanas de evaluación de la carrera.',
        onClick: actions.onToggleCalendar,
        variant: 'default',
        className: 'bg-green-600 hover:bg-green-700 text-white',
      },
      {
        icon: BarChart3,
        label: 'Reportes Generales',
        description: 'Ver reportes del departamento',
        ayuda: 'Abre los reportes de calificaciones y participación del departamento.',
        onClick: actions.onViewReports,
        variant: 'outline',
        className: 'border-gray-300',
      },
    ],
  };
}

function buildUserDashboardData(
  type: User['type'],
  stats: StudentStats,
  actions: DashboardActions
): UserDashboardData {
  if (type === 'teacher') return buildTeacherData(actions);
  if (type === 'coordinator') return buildCoordinatorData(actions);
  return buildStudentData(stats, actions);
}

async function fetchDashboardData(
  type: User['type'],
  apply: (next: {
    stats: StudentStats;
    materias: unknown[];
    loading: boolean;
    error: string;
  }) => void
) {
  if (type !== 'student') {
    apply({ stats: EMPTY_STUDENT_STATS, materias: [], loading: false, error: '' });
    return;
  }

  try {
    const [statsData, materiasData] = await Promise.all([
      fetchStudentStats(),
      fetchStudentEnrolledSubjects(),
    ]);
    apply({
      stats: {
        evaluacionesCompletadas: Number(statsData?.evaluacionesCompletadas ?? 0),
        evaluacionesPendientes: Number(statsData?.evaluacionesPendientes ?? 0),
        materiasMatriculadas: Number(statsData?.materiasMatriculadas ?? 0),
        promedioGeneral: Number(statsData?.promedioGeneral ?? 0),
        progresoGeneral: Number(statsData?.progresoGeneral ?? 0),
      },
      materias: materiasDesdeApi(materiasData).materiasMatriculadas,
      loading: false,
      error: '',
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    const mensaje = err.response?.data?.error || err.message || 'No se pudieron cargar tus materias.'
    apply({
      stats: EMPTY_STUDENT_STATS,
      materias: [],
      loading: false,
      error: mensaje,
    });
  }
}

function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function DashboardLoading({ user }: Readonly<{ user: User }>) {
  return (
    <Shell>
      <Header user={user} />
      <main className="max-w-[1700px] mx-auto p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="mt-4 text-gray-700">Cargando tu panel...</p>
        </div>
      </main>
    </Shell>
  );
}

function DashboardError({
  user,
  error,
  onRetry,
}: Readonly<{ user: User; error: string; onRetry: () => void }>) {
  return (
    <Shell>
      <Header user={user} />
      <main className="max-w-[1700px] mx-auto p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full rounded-lg bg-white p-6 shadow-lg border border-gray-200">
          <p className="text-red-600 font-medium">Error al cargar los datos</p>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button className="mt-4" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      </main>
    </Shell>
  );
}

function WelcomeCard({ user }: Readonly<{ user: User }>) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className="bg-white shadow-md border border-gray-200 p-6">
        <CardContent className="space-y-3">
          <h2 className="text-3xl font-semibold text-gray-900">
            {getGreeting()}, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-lg text-gray-600">
            Aquí tienes un resumen de tu actividad reciente en el sistema.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActionsCard({ actions }: Readonly<{ actions: QuickAction[] }>) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <Card className="bg-white shadow-md border border-gray-200 p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-gray-700" />
            <CardTitle className="text-2xl text-gray-900">Acciones Rápidas</CardTitle>
          </div>
          <CardDescription className="text-base">
            Aca estan las opciones de lo que puedes realizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map((action) => (
              <div key={action.label} className="relative">
                <motion.button
                  type="button"
                  onClick={action.onClick}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`min-h-36 w-full rounded-xl border px-6 py-6 pr-10 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
                    action.variant === 'default'
                      ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                      : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <action.icon className="h-8 w-8" />
                  <span className="text-lg font-semibold leading-tight">{action.label}</span>
                  <span className="text-sm opacity-80">{action.description}</span>
                </motion.button>
                <span className="absolute right-3 top-3 z-10">
                  <HelpTooltip
                    texto={action.ayuda}
                    etiqueta={`Qué hace ${action.label}`}
                    className={action.variant === 'default' ? 'text-white/90 hover:text-white' : undefined}
                  />
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  suffix = '',
  description,
  help,
  valueClass,
  delay,
  icon,
}: Readonly<{
  title: string;
  value: string;
  suffix?: string;
  description: string;
  help?: string;
  valueClass: string;
  delay: number;
  icon: React.ReactNode;
}>) {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay }}>
      <Card className="bg-white shadow-sm hover:shadow-md transition-all border border-gray-200/80 p-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium text-gray-900 text-left flex items-center gap-2">
            {title}
            {help ? <HelpTooltip texto={help} /> : null}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${valueClass}`}>
            {value}
            {suffix}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-left">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatsGrid({ type, stats }: Readonly<{ type: User['type']; stats: Record<string, unknown> }>) {
  const primary = getPrimaryStat(type, stats);
  const secondary = getSecondaryStat(type, stats);
  const tertiary = getTertiaryStat(type, stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title={primary.title}
        value={textoEstadistica(primary.value)}
        suffix={primary.suffix}
        description={primary.description}
        help={primary.help}
        valueClass={primary.valueClass}
        delay={0.2}
        icon={<primary.Icon className={primary.iconClass} />}
      />
      <StatCard
        title={secondary.title}
        value={textoEstadistica(secondary.value)}
        description={secondary.description}
        help={secondary.help}
        valueClass="text-green-600"
        delay={0.3}
        icon={<Star className="h-6 w-6 text-green-600 ml-4" />}
      />
      <StatCard
        title={tertiary.title}
        value={textoEstadistica(tertiary.value)}
        description={tertiary.description}
        help={tertiary.help}
        valueClass="text-university-red"
        delay={0.4}
        icon={<BookOpen className="h-6 w-6 text-university-red ml-4" />}
      />
    </div>
  );
}

function MateriasList({ filas }: Readonly<{ filas: MateriaMatriculadaVista[] }>) {
  if (filas.length === 0) {
    return (
      <EmptyState
        titulo="No tienes materias matriculadas"
        descripcion="Solo se listan materias en las que estás matriculado. Si acabas de inscribirte, actualiza el panel."
        accion="Actualizar"
        onAccion={() => window.location.reload()}
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {filas.map((materia) => (
        <li key={textoEstadistica(materia.id)} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900">
                {materia.codigo} · {materia.nombre}
              </p>
              <p className="text-sm text-gray-600">
                {materia.grupo} · {materia.profesor}
              </p>
            </div>
            <div className="text-sm text-gray-500 sm:text-right">
              <p>{materia.periodo}</p>
              <p>
                {materia.horario} · {materia.aula}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MateriasCard({ filas }: Readonly<{ filas: MateriaMatriculadaVista[] }>) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="bg-white shadow-md border border-gray-200 p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-700" />
            <CardTitle className="text-xl text-gray-900">Mis materias matriculadas</CardTitle>
          </div>
          <CardDescription className="text-base">
            Solo se listan materias en las que estás matriculado. Evalúa en las fechas vigentes o escaneando el QR en clase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MateriasList filas={filas} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardReady({
  user,
  currentUser,
  userData,
  filasMaterias,
  showCalendar,
  onToggleCalendar,
}: Readonly<{
  user: User;
  currentUser: User;
  userData: UserDashboardData;
  filasMaterias: MateriaMatriculadaVista[];
  showCalendar: boolean;
  onToggleCalendar: () => void;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      <div className="relative z-10">
        <Header user={currentUser} />

        <main className="max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          <WelcomeCard user={user} />

          {user.type === 'student' && (
            <OnboardingBanner
              rol="estudiante"
              pasos={[
                'Revisa las materias en las que estás matriculado.',
                'Evalúa en las fechas vigentes o con el QR de la clase.',
                'Al terminar puedes volver al panel o evaluar la siguiente materia.',
              ]}
            />
          )}

          <div className="flex flex-col gap-8">
            <div className="order-1 lg:order-2">
              <QuickActionsCard actions={userData.quickActions} />
            </div>

            <div className="order-2 lg:order-1">
              <StatsGrid type={user.type} stats={userData.stats} />
            </div>
          </div>

          {user.type === 'student' && (
            <MateriasCard filas={filasMaterias} />
          )}
        </main>
      </div>

      <AnimatePresence>
        {showCalendar && <Calendar onClose={onToggleCalendar} />}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard({
  user,
  onViewReports,
}: Readonly<DashboardProps>) {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [studentStats, setStudentStats] = useState(EMPTY_STUDENT_STATS);
  const [materiasMatriculadas, setMateriasMatriculadas] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = user ?? readStoredUser() ?? FALLBACK_USER;

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData(currentUser.type, (next) => {
      if (cancelled) return;
      setStudentStats(next.stats);
      setMateriasMatriculadas(next.materias);
      setLoading(next.loading);
      setError(next.error);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser.type]);

  const actions: DashboardActions = {
    onStartEvaluation: () => navigate('/evaluate/selection'),
    onViewReports: onViewReports ?? (() => navigate('/reports')),
    onViewSurvey: () => navigate('/survey'),
    onToggleCalendar: () => setShowCalendar((open) => !open),
  };

  const userData = buildUserDashboardData(currentUser.type, studentStats, actions);

  if (loading && currentUser.type === 'student') {
    return <DashboardLoading user={currentUser} />;
  }

  if (error && currentUser.type === 'student') {
    return (
      <DashboardError
        user={currentUser}
        error={error}
        onRetry={() => {
          setError('');
          setLoading(true);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <DashboardReady
      user={user}
      currentUser={currentUser}
      userData={userData}
      filasMaterias={filasVistaMaterias(materiasMatriculadas)}
      showCalendar={showCalendar}
      onToggleCalendar={actions.onToggleCalendar}
    />
  );
}
