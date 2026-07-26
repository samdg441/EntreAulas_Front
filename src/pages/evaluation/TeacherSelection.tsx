import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CardHeader, 
  CardContent, 
  CardDescription, 
  CardTitle 
} from '../../components/Card';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Header from '../../components/Header';
import { Teacher, Course, User } from '../../types';
import { fetchTeachersWithCourses, fetchCourseGroups } from '../../api/teachers'
import { 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  GraduationCap, 
  Clock,
  BookOpen,
  User as UserIcon
} from 'lucide-react';  

// Importar la imagen de fondo
const fondo = new URL('../../assets/fondo.webp', import.meta.url).href;

interface TeacherSelectionProps {
  onTeacherCourseSelected: (teacher: Teacher, course: Course) => void;
  user: User;
}

export default function TeacherSelection({ onTeacherCourseSelected, user }: TeacherSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [courseGroups, setCourseGroups] = useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchTeachersWithCourses()
        if (!active) return
        setTeachers(data)
      } catch (e: any) {
        if (!active) return
        setError(e?.message ?? 'Error cargando docentes')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const filteredTeachers = useMemo(() => {
    const source = teachers
    if (!searchTerm) return source;
    return source.filter(teacher =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.courses.some(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, teachers]);

  const handleTeacherSelect = (teacher: Teacher) => {
    console.log('🔍 handleTeacherSelect called with teacher:', teacher);
    console.log('🔍 Teacher courses:', teacher.courses);
    setSelectedTeacher(teacher);
    setSelectedCourse(null);
    setCourseGroups([]);
    setSelectedGroup(null);
  };

  const handleCourseSelect = async (courseId: string) => {
    console.log('🔍 handleCourseSelect called with courseId:', courseId, 'type:', typeof courseId);
    console.log('🔍 selectedTeacher:', selectedTeacher);
    console.log('🔍 All courses:', selectedTeacher?.courses);
    
    if (!selectedTeacher) {
      console.log('❌ No selectedTeacher, returning');
      return;
    }
    
    // Buscar curso con comparación más flexible (string vs number)
    const course = selectedTeacher.courses.find(c => {
      console.log('🔍 Comparing course.id:', c.id, 'type:', typeof c.id, 'with courseId:', courseId, 'type:', typeof courseId);
      return String(c.id) === String(courseId) || Number(c.id) === Number(courseId);
    });
    console.log('🔍 Found course:', course);
    
    if (course) {
      console.log('✅ Setting selectedCourse and loading groups...');
      setSelectedCourse(course);
      setSelectedGroup(null);
      setLoadingGroups(true);
      
      try {
        console.log('📡 Calling fetchCourseGroups with:', {
          profesorId: selectedTeacher.id,
          courseId: courseId
        });
        
        const groups = await fetchCourseGroups(selectedTeacher.id, courseId);
        console.log('✅ Groups loaded successfully:', groups);
        setCourseGroups(groups);
      } catch (error) {
        console.error('❌ Error loading groups:', error);
        setCourseGroups([]);
      } finally {
        setLoadingGroups(false);
        console.log('🏁 Loading groups finished');
      }
    } else {
      console.log('❌ Course not found in selectedTeacher.courses');
      console.log('🔍 Available course IDs:', selectedTeacher.courses.map(c => ({ id: c.id, type: typeof c.id, name: c.name })));
    }
  };

  const handleGroupSelect = (group: any) => {
    console.log('🔍 Group selected:', group);
    setSelectedGroup(group);
  };

  const handleContinue = () => {
    if (selectedTeacher && selectedCourse && selectedGroup) {
      onTeacherCourseSelected(selectedTeacher, selectedCourse);
      navigate('/evaluate/form', { 
        state: { 
          teacher: selectedTeacher, 
          course: selectedCourse,
          group: selectedGroup
        } 
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Fondo fijo que cubre toda la página */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay oscuro que cubre toda la página */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
      <div className="relative z-10">
        {/* Header sin botón de volver */}
        <Header 
          user={user}
          title="Evaluación Docente - Paso 1 de 2"
          subtitle="Selecciona el profesor y curso a evaluar"
        />

        <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Botón de volver independiente - Posicionado en la esquina superior izquierda */}
          <div className="flex justify-start">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToDashboard}
              className="text-sm sm:text-base py-2 px-3 sm:px-4 bg-white bg-opacity-90 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
              <span className="sm:hidden">Volver</span>
            </Button>
          </div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white shadow-md border border-gray-200 p-3 sm:p-4 lg:p-6">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  Buscar Profesor
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Busca por nombre del profesor, departamento o nombre del curso
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar profesor o curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm sm:text-base"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Teachers List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-md border border-gray-200 p-3 sm:p-4 lg:p-6">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-gray-900 text-base sm:text-lg">Profesores Disponibles</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {filteredTeachers.length} profesor(es) encontrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto pt-0">
                  {loading && (
                    <div className="text-center text-gray-500">Cargando docentes...</div>
                  )}
                  {error && (
                    <div className="text-center text-red-600">{error}</div>
                  )}
                  {!loading && !error && filteredTeachers.length === 0 && (
                    <div className="text-center text-gray-500">No se encontraron docentes</div>
                  )}
                  {!loading && !error && filteredTeachers.map((teacher, index) => (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedTeacher?.id === teacher.id
                          ? 'border-red-500 bg-red-50 shadow-md'
                          : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleTeacherSelect(teacher)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{teacher.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{teacher.department}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {teacher.courses.map(course => (
                              <Badge key={course.id} variant="outline" className="text-xs bg-white">
                                {course.code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {selectedTeacher?.id === teacher.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-red-600"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Selection */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`bg-white shadow-md border border-gray-200 p-3 sm:p-4 lg:p-6 ${selectedTeacher ? '' : 'opacity-50'}`}>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-gray-900 text-base sm:text-lg">Seleccionar Curso</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {selectedTeacher 
                      ? `Cursos impartidos por ${selectedTeacher.name}`
                      : 'Primero selecciona un profesor'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-0">
                  {selectedTeacher ? (
                    <>
                      {console.log('🔍 Rendering course selection for teacher:', selectedTeacher.name, 'with courses:', selectedTeacher.courses)}
                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">Curso</label>
                        <div className="relative">
                          <select 
                            value={selectedCourse?.id || ''} 
                            onChange={(e) => {
                              console.log('🔍 Select onChange triggered with value:', e.target.value);
                              handleCourseSelect(e.target.value);
                            }}
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg bg-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm sm:text-base"
                          >
                            <option value="">Selecciona un curso</option>
                            {selectedTeacher.courses.map(course => {
                              console.log('🔍 Rendering course option:', course);
                              return (
                                <option key={course.id} value={course.id}>
                                  {course.name} ({course.code})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {selectedCourse && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-3">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Información del Curso</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                <span className="font-medium text-gray-900 truncate">{selectedCourse.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">Código:</span>
                                <span>{selectedCourse.code}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="truncate">{selectedCourse.schedule}</span>
                              </div>
                            </div>
                          </div>

                          {/* Sección de Grupos */}
                          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-3">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Grupos Disponibles</h4>
                            {loadingGroups ? (
                              <div className="text-center text-gray-500 text-xs sm:text-sm">Cargando grupos...</div>
                            ) : courseGroups.length > 0 ? (
                              <div className="space-y-2">
                                {courseGroups.map((group: any) => (
                                  <div 
                                    key={group.id} 
                                    className={`p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                      selectedGroup?.id === group.id
                                        ? 'border-red-500 bg-red-50 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-red-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleGroupSelect(group)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <span className="font-medium text-gray-900 text-sm sm:text-base">Grupo {group.numero_grupo}</span>
                                        {group.horario && (
                                          <p className="text-xs sm:text-sm text-gray-600 truncate">{group.horario}</p>
                                        )}
                                        {group.aula && (
                                          <p className="text-xs sm:text-sm text-gray-600">Aula: {group.aula}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {group.cup && (
                                          <Badge variant="outline" className="text-xs">
                                            {group.cup} cupos
                                          </Badge>
                                        )}
                                        {selectedGroup?.id === group.id && (
                                          <div className="text-red-600">
                                            <ChevronRight className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500">No hay grupos disponibles</div>
                            )}
                          </div>

                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                            <h4 className="font-medium text-gray-900">Información del Profesor</h4>
                            <div className="flex items-start gap-3">
                              <div>
                                <p className="font-medium text-gray-900">{selectedTeacher.name}</p>
                                <p className="text-sm text-gray-600">{selectedTeacher.department}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  <UserIcon className="h-3 w-3" />
                                  {selectedTeacher.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          <motion.div
                            whileHover={{ scale: selectedGroup ? 1.02 : 1 }}
                            whileTap={{ scale: selectedGroup ? 0.98 : 1 }}
                          >
                            <Button 
                              onClick={handleContinue}
                              disabled={!selectedGroup}
                              className={`w-full py-2.5 sm:py-3 text-sm sm:text-base ${
                                selectedGroup 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <span className="truncate">
                                {selectedGroup ? 'Continuar a Evaluación' : 'Selecciona un grupo'}
                              </span>
                              <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <GraduationCap className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm">Selecciona un profesor para ver sus cursos disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}