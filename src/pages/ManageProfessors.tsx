import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCoordinatorDashboardSummary, fetchCoordinatorProfessorStats } from '../api/teachers'
import Header from '../components/Header'
import Card, { CardHeader, CardContent, CardDescription, CardTitle } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, ChevronRight, GraduationCap, BookOpen, User as UserIcon, Star, BarChart3 } from 'lucide-react'

export default function ManageProfessors() {
  const navigate = useNavigate()
  const fondo = new URL('../assets/fondo.webp', import.meta.url).href
  const [searchParams] = useSearchParams()

  const storedUser = (() => {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null } catch { return null }
  })()

  // Estado de datos
  const [searchTerm, setSearchTerm] = useState('')
  const [professors, setProfessors] = useState<any[]>([])
  const [selectedProfessor, setSelectedProfessor] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || '2026-1')
  const [professorStats, setProfessorStats] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Cargar profesores reales por carrera: primero `careerId` por query, sino del coordinador guardado
  useEffect(() => {
    const load = async () => {
      console.log('🚀 useEffect ejecutándose...', new Date().toLocaleTimeString())
      setLoading(true)
      try {
        const pages = await Promise.all([
          fetchCoordinatorDashboardSummary({ page: 1, pageSize: 50 }),
          fetchCoordinatorDashboardSummary({ page: 2, pageSize: 50 })
        ])
        const normalized = pages
          .flatMap((p) => p.teachers || [])
          .map((p: any) => ({
            id: p.profesorId,
            name: p.nombre || 'Sin nombre',
            department: 'Carrera del coordinador',
            email: p.email || '',
            promedio: p.promedio,
            totalEvaluaciones: p.totalEvaluaciones
          }))
        setProfessors(normalized)
      } catch (e) {
        console.error('❌ Error loading professors by career:', e)
        setProfessors([])
      } finally {
        console.log('🏁 Finalizando carga, setLoading(false)')
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    // El backend ya filtra por carrera, solo aplicar búsqueda si hay término
    if (!searchTerm) return professors
    
    return professors.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, professors])

  const backToDashboard = () => navigate('/dashboard-coordinador')

  const handleProfessorSelection = (professor: any) => {
    console.log('🔍 Profesor seleccionado:', professor)
    console.log('🔍 Cursos del profesor:', professor.courses)
    console.log('🔍 Cantidad de cursos:', professor.courses?.length || 0)
    setSelectedProfessor(professor)
    setProfessorStats(null)
  }

  useEffect(() => {
    const loadStats = async () => {
      if (!selectedProfessor?.id) return
      try {
        setLoadingStats(true)
        const data = await fetchCoordinatorProfessorStats(selectedProfessor.id, selectedPeriod)
        setProfessorStats(data)
      } catch (error) {
        console.error('Error cargando estadísticas del docente:', error)
        setProfessorStats(null)
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [selectedProfessor?.id, selectedPeriod])

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      <div className="relative z-10">
        <Header user={{ id: storedUser?.id || '', name: `${storedUser?.nombre || ''} ${storedUser?.apellido || ''}`.trim() || 'Coordinador', type: 'coordinator', email: storedUser?.email || '' }} />

        <main className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
          <div className="flex justify-start">
            <Button variant="ghost" size="lg" onClick={backToDashboard} className="ml-2 text-lg py-2 px-4 bg-white bg-opacity-90 rounded-lg shadow-md hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white shadow-md border border-gray-200 p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Search className="h-5 w-5" /> Gestionar Profesores
                </CardTitle>
                <CardDescription>Busca y gestiona profesores y sus cursos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Buscar profesor o curso..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white shadow-md border border-gray-200 p-6">
                <CardHeader>
                  <CardTitle className="text-gray-900">Profesores</CardTitle>
                  <CardDescription>{filtered.length} profesor(es) encontrado(s)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      <span className="ml-3 text-gray-600">Cargando profesores...</span>
                    </div>
                  ) : filtered.length > 0 ? (
                    filtered.map((p, index) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${selectedProfessor?.id === p.id ? 'border-red-500 bg-red-50 shadow-md' : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'}`}
                        onClick={() => handleProfessorSelection(p)}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{p.name}</h3>
                            <p className="text-sm text-gray-600">{p.email || 'Sin correo registrado'}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge variant="outline" className="text-xs bg-white text-gray-700">
                                {p.totalEvaluaciones || 0} evaluaciones
                              </Badge>
                              {p.promedio > 0 && (
                                <Badge variant="outline" className={`text-xs ${p.promedio < 4 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                  Prom. {Number(p.promedio).toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {selectedProfessor?.id === p.id && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-600">
                              <ChevronRight className="h-5 w-5" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No se encontraron profesores en esta carrera</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className={`bg-white shadow-md border border-gray-200 p-6 ${selectedProfessor ? '' : 'opacity-70'}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Estadísticas del Docente</CardTitle>
                  <CardDescription>
                    {selectedProfessor ? `Evaluación de ${selectedProfessor.name}` : 'Selecciona un docente para ver su desempeño'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedProfessor ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex-1">
                          <p className="font-medium text-gray-900">{selectedProfessor.name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <UserIcon className="h-3 w-3" />
                            {selectedProfessor.email || 'Sin correo registrado'}
                          </p>
                        </div>
                        <select
                          value={selectedPeriod}
                          onChange={(e) => setSelectedPeriod(e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                          <option value="2026-1">2026-1</option>
                          <option value="2025-2">2025-2</option>
                          <option value="2025-1">2025-1</option>
                          <option value="2024-2">2024-2</option>
                        </select>
                      </div>

                      {loadingStats ? (
                        <div className="text-center py-8 text-gray-500">Cargando estadísticas...</div>
                      ) : professorStats ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                              <BarChart3 className="h-5 w-5 text-red-600 mb-2" />
                              <p className="text-xs text-gray-600">Evaluaciones</p>
                              <p className="text-2xl font-bold text-red-600">{professorStats.summary?.totalEvaluaciones || 0}</p>
                            </div>
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                              <Star className="h-5 w-5 text-yellow-600 mb-2" />
                              <p className="text-xs text-gray-600">Promedio</p>
                              <p className="text-2xl font-bold text-yellow-600">{professorStats.summary?.promedio || 0}/5</p>
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <UserIcon className="h-5 w-5 text-blue-600 mb-2" />
                              <p className="text-xs text-gray-600">Evaluadores</p>
                              <p className="text-2xl font-bold text-blue-600">{professorStats.summary?.estudiantesEvaluadores || 0}</p>
                            </div>
                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                              <BookOpen className="h-5 w-5 text-green-600 mb-2" />
                              <p className="text-xs text-gray-600">Cursos evaluados</p>
                              <p className="text-2xl font-bold text-green-600">{professorStats.summary?.totalCursos || 0}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Promedio por Categoría</h4>
                            <div className="space-y-2">
                              {(professorStats.categories || []).length > 0 ? professorStats.categories.map((c: any) => (
                                <div key={c.categoriaId} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-sm text-gray-700">{c.nombre}</span>
                                  <Badge variant="outline">{Number(c.promedio || 0).toFixed(2)}</Badge>
                                </div>
                              )) : (
                                <p className="text-sm text-gray-500">No hay datos por categoría para este período.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Cursos Evaluados</h4>
                            <div className="space-y-2">
                              {(professorStats.courses || []).length > 0 ? professorStats.courses.map((c: any) => (
                                <div key={c.cursoId} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">{c.codigo ? `${c.codigo} - ` : ''}{c.nombre}</span>
                                    <Badge variant="outline">{Number(c.promedio || 0).toFixed(2)}</Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{c.totalEvaluaciones} evaluaciones</p>
                                </div>
                              )) : (
                                <p className="text-sm text-gray-500">No hay cursos evaluados para este período.</p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">No se pudieron cargar estadísticas del docente.</div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecciona un docente para ver sus estadísticas de evaluación</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}


