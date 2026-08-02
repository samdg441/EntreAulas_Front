import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './features/auth/Login'
import ForgotPassword from './features/auth/ForgotPassword'
import ProfilePage from './features/auth/ProfilePage'
import Dashboard from './features/dashboard-student/Dashboard'
import DashboardProfesor from './features/dashboard-teacher/DashboardProfesor'
import DashboardCoordinador from './features/dashboard-coordinator/DashboardCoordinador'
import ManageProfessors from './features/dashboard-coordinator/ManageProfessors'
import DashboardDecano from './features/dashboard-dean/DashboardDecano'
import CareerSubjectsPage from './features/dashboard-dean/CareerSubjectsPage'
import ProfessorsPage from './features/dashboard-dean/ProfessorsPage'
import CareerResultsPage from './features/dashboard-dean/CareerResultsPage'
import DashboardAdmin from './features/dashboard-admin/DashboardAdmin'
import AdminUsersPage from './features/dashboard-admin/AdminUsersPage'
import TeacherSelection from './features/evaluations/TeacherSelection'
import EvaluationForm from './features/evaluations/EvaluationForm'
import QrEvaluationEntry from './features/evaluations/QrEvaluationEntry'
import ReportsPage from './features/evaluations/ReportsPage'
import ScheduleSurveys from './features/evaluations/ScheduleSurveys'
import SurveyResults from './features/evaluations/SurveyResults'
import SurveyView from './features/evaluations/SurveyView'
import EvaluationGoodbye from './features/evaluations/EvaluationGoodbye'
import ProtectedRoute from './routes/ProtectedRoute'
import ForbiddenPage from './routes/ForbiddenPage'
import { User, Teacher, Course } from './types'
import { useAuth } from './context/AuthContext'

function App() {
  const { user } = useAuth()

  const handleStartEvaluation = () => {
    // La navegación se manejará dentro del componente Dashboard con useNavigate
  }

  const handleViewReports = () => {
    console.log('Ver reportes')
  }

  const handleTeacherCourseSelected = (teacher: Teacher, course: Course) => {
    console.log('Profesor seleccionado:', teacher.name)
    console.log('Curso seleccionado:', course.name)
  }

  const handleBackFromEvaluation = () => {
    // La navegación se manejará dentro del componente con useNavigate
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
          } 
        />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-evaluacion"
          element={<QrEvaluationEntry />}
        />
        <Route 
          path="/dashboard" 
          element={
            user ? <DashboardRouter /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/dashboard-estudiante" 
          element={
            user ? <DashboardWrapper onStartEvaluation={handleStartEvaluation} onViewReports={handleViewReports} /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/dashboard-profesor" 
          element={
            user ? <DashboardProfesorWrapper /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/dashboard-coordinador" 
          element={
            user ? <DashboardCoordinadorWrapper /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/dashboard-decano" 
          element={
            <ProtectedRoute>
              <DashboardDecanoWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/career-subjects" 
          element={
            <ProtectedRoute>
              <CareerSubjectsPageWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/professors" 
          element={
            <ProtectedRoute>
              <ProfessorsPageWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/career-results" 
          element={
            <ProtectedRoute>
              <CareerResultsPageWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard-admin" 
          element={
            user ? <DashboardAdminWrapper /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/evaluate/selection" 
          element={
            <TeacherSelectionWrapper 
              onTeacherCourseSelected={handleTeacherCourseSelected}
              onBack={handleBackFromEvaluation}
            />
          } 
        />
        <Route 
          path="/evaluate/form" 
          element={
            <EvaluationFormWrapper />
          } 
        />
        <Route
          path="/evaluate/goodbye"
          element={<EvaluationGoodbyeWrapper />}
        />
        {/* Nueva ruta para reportes */}
        <Route 
          path="/reports" 
          element={
            <ReportsPageWrapper />
          } 
        />
        <Route 
          path="/surveys/schedule" 
          element={
            <ScheduleSurveys />
          } 
        />
        <Route 
          path="/profesores/gestionar" 
          element={
            <ManageProfessors />
          } 
        />
        <Route 
          path="/survey" 
          element={
            <SurveyViewWrapper />
          } 
        />
        <Route 
          path="/reports/survey-results" 
          element={
            <SurveyResultsWrapper />
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}


function DashboardWrapper({ onStartEvaluation, onViewReports }: { 
  onStartEvaluation: () => void, 
  onViewReports: () => void 
}) {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado por Dashboard
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: authUser.tipo_usuario === 'estudiante' ? 'student' : 
          authUser.tipo_usuario === 'profesor' ? 'teacher' : 
          authUser.tipo_usuario === 'coordinador' ? 'coordinator' : 
          authUser.tipo_usuario === 'admin' ? 'decano' : 'student',
    email: authUser.email,
  }
  
  return <Dashboard user={user} onStartEvaluation={onStartEvaluation} onViewReports={onViewReports} />
}

function TeacherSelectionWrapper({ onTeacherCourseSelected, onBack }: { 
  onTeacherCourseSelected: (teacher: Teacher, course: Course) => void,
  onBack: () => void
}) {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'student',
    email: authUser.email,
  }
  
  return <TeacherSelection user={user} onTeacherCourseSelected={onTeacherCourseSelected} onBack={onBack} />
}

function EvaluationFormWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  return <EvaluationForm />
}

function EvaluationGoodbyeWrapper() {
  const { user: authUser } = useAuth()

  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  return <EvaluationGoodbye />
}

function ReportsPageWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'student',
    email: authUser.email,
  }
  
  // Si es coordinador, mantener el tipo como 'coordinator' para usar el endpoint correcto (by-career)
  // No convertir a 'teacher' porque eso haría que use by-professor con un profesor_id específico
  if (authUser.tipo_usuario === 'coordinador') {
    user.type = 'coordinator'; // Mantener como coordinador para usar by-career
  }
  
  return <ReportsPage user={user} />
}

// Router que redirige al dashboard correcto según el tipo de usuario
function DashboardRouter() {
  const { user: authUser, getDashboardPath } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Obtener el dashboard correcto según el tipo de usuario
  const dashboardPath = getDashboardPath()
  
  return <Navigate to={dashboardPath} replace />
}

function DashboardProfesorWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'teacher',
    email: authUser.email,
  }
  
  return <DashboardProfesor user={user} />
}

function DashboardCoordinadorWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'coordinator',
    email: authUser.email,
  }
  
  return <DashboardCoordinador user={user} />
}

function DashboardDecanoWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'decano',
    email: authUser.email,
    roles: authUser.roles || []
  }
  
  return <DashboardDecano user={user} />
}

function CareerSubjectsPageWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'decano',
    email: authUser.email,
    roles: authUser.roles || []
  }
  
  return <CareerSubjectsPage user={user} />
}

function ProfessorsPageWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'decano',
    email: authUser.email,
    roles: authUser.roles || []
  }
  
  return <ProfessorsPage user={user} />
}

function CareerResultsPageWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'decano',
    email: authUser.email,
    roles: authUser.roles || []
  }
  
  return <CareerResultsPage user={user} />
}

function DashboardAdminWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'admin',
    email: authUser.email,
  }
  
  return <DashboardAdmin user={user} />
}

function SurveyViewWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'teacher',
    email: authUser.email,
  }
  
  return <SurveyView user={user} />
}

function SurveyResultsWrapper() {
  const { user: authUser } = useAuth()
  
  if (!authUser) {
    return <Navigate to="/login" replace />
  }
  
  // Convertir el usuario del AuthContext al formato esperado
  const user: User = {
    id: authUser.id,
    name: `${authUser.nombre} ${authUser.apellido}`.trim(),
    type: (authUser.tipo_usuario as any) ?? 'teacher',
    email: authUser.email,
  }
  
  return <SurveyResults user={user} />
}

export default App