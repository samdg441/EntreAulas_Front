import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitEvaluation, fetchStudentInfo, fetchEvaluationQuestions } from '../../api/teachers';
import { CardHeader, CardContent, CardTitle, CardDescription } from '../../components/Card';
import { HiOutlineCalendar } from "react-icons/hi";
import { FaRegBuilding } from "react-icons/fa";
import { FaBook, FaUsers, FaCommentDots, FaCheckCircle } from "react-icons/fa";

import Card from '../../components/Card';
import Button from '../../components/Button';
import Header from '../../components/Header';
import LikertScale from '../../components/LikertScale';
import ProgressBar from '../../components/ProgressBar';
import ConfirmationModal from '../../components/ConfirmationModal';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const fondo = new URL('../../assets/fondo.webp', import.meta.url).href;

interface EvaluationQuestion {
  id: string;
  category: string;
  question: string;
  type: 'rating' | 'texto';
  options?: any;
}

export default function EvaluationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teacher, course, group } = location.state || {};
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [ratings, setRatings] = useState<number[]>([]);
  const [textAnswers, setTextAnswers] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [comments, setComments] = useState('');
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar información del estudiante y preguntas al montar el componente
  useEffect(() => {
    const loadStudentInfoAndQuestions = async () => {
      try {
        console.log('🔍 Loading student info and questions...');
        
        // Obtener información del estudiante
        const studentData = await fetchStudentInfo();
        console.log('✅ Student info loaded:', studentData);

        // Obtener preguntas según el curso (no la carrera del estudiante)
        if (course?.id) {
          const questionsData = await fetchEvaluationQuestions(String(course.id));
        const fetchedQuestions: EvaluationQuestion[] = questionsData.questions || [];

        // Si el backend no encontró preguntas, usar fallback (evita pantalla en blanco)
        if (fetchedQuestions.length === 0) {
          const defaultQuestions: EvaluationQuestion[] = [
            { id: '1', category: 'Claridad Expositiva', question: 'El profesor explica claramente los conceptos del curso', type: 'rating' },
            { id: '2', category: 'Dominio del Tema', question: 'El profesor demuestra amplio conocimiento de la materia', type: 'rating' },
            { id: '3', category: 'Disponibilidad', question: 'El profesor está disponible para resolver dudas', type: 'rating' },
            { id: '4', category: 'Material de Clase', question: 'El material proporcionado es adecuado y útil', type: 'rating' },
            { id: '5', category: 'Evaluación Justa', question: 'Las evaluaciones reflejan adecuadamente los contenidos', type: 'rating' },
            { id: '6', category: 'Motivación', question: 'El profesor motiva a los estudiantes a participar', type: 'rating' },
            { id: '7', category: 'Organización', question: 'Las clases están bien organizadas y estructuradas', type: 'rating' },
            { id: '8', category: 'Retroalimentación', question: 'Proporciona retroalimentación útil sobre el progreso', type: 'rating' },
            { id: '9', category: 'Respeto', question: 'Muestra respeto por las opiniones de los estudiantes', type: 'rating' },
            { id: '10', category: 'Innovación', question: 'Utiliza métodos innovadores en la enseñanza', type: 'rating' }
          ];

          setQuestions(defaultQuestions);
          setRatings(Array(defaultQuestions.length).fill(0));
          setTextAnswers(Array(defaultQuestions.length).fill(''));
        } else {
          setQuestions(fetchedQuestions);
          setRatings(Array(fetchedQuestions.length).fill(0));
          setTextAnswers(Array(fetchedQuestions.length).fill(''));
        }

        console.log(
          '✅ Questions loaded for course:',
          questionsData.courseName,
          'Code:',
          questionsData.courseCode,
          'Career ID:',
          questionsData.carreraId,
          'Count:',
          fetchedQuestions.length
        );
        } else {
          throw new Error('No course ID available');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading student info or questions:', error);
        // Fallback a preguntas por defecto
        const defaultQuestions: EvaluationQuestion[] = [
          { id: '1', category: 'Claridad Expositiva', question: 'El profesor explica claramente los conceptos del curso', type: 'rating' },
          { id: '2', category: 'Dominio del Tema', question: 'El profesor demuestra amplio conocimiento de la materia', type: 'rating' },
          { id: '3', category: 'Disponibilidad', question: 'El profesor está disponible para resolver dudas', type: 'rating' },
          { id: '4', category: 'Material de Clase', question: 'El material proporcionado es adecuado y útil', type: 'rating' },
          { id: '5', category: 'Evaluación Justa', question: 'Las evaluaciones reflejan adecuadamente los contenidos', type: 'rating' },
          { id: '6', category: 'Motivación', question: 'El profesor motiva a los estudiantes a participar', type: 'rating' },
          { id: '7', category: 'Organización', question: 'Las clases están bien organizadas y estructuradas', type: 'rating' },
          { id: '8', category: 'Retroalimentación', question: 'Proporciona retroalimentación útil sobre el progreso', type: 'rating' },
          { id: '9', category: 'Respeto', question: 'Muestra respeto por las opiniones de los estudiantes', type: 'rating' },
          { id: '10', category: 'Innovación', question: 'Utiliza métodos innovadores en la enseñanza', type: 'rating' }
        ];
        setQuestions(defaultQuestions);
        setRatings(Array(defaultQuestions.length).fill(0));
        setTextAnswers(Array(defaultQuestions.length).fill(''));
        setLoading(false);
      }
    };

    loadStudentInfoAndQuestions();
  }, [course?.id]);

  const ratingLabels = ['Muy Deficiente', 'Deficiente', 'Regular', 'Bueno', 'Excelente'];

  const handleRatingSelect = (rating: number) => {
    const newRatings = [...ratings];
    newRatings[currentQuestion] = rating;
    setRatings(newRatings);
  };

  const handleTextAnswerChange = (text: string) => {
    const newTextAnswers = [...textAnswers];
    newTextAnswers[currentQuestion] = text;
    setTextAnswers(newTextAnswers);
  };

  const handleNext = () => {
    const currentQ = questions[currentQuestion];
    
    // Validar según el tipo de pregunta
    if (currentQ.type === 'rating' && ratings[currentQuestion] === 0) {
      alert('Por favor selecciona una calificación antes de continuar');
      return;
    }
    
    if (currentQ.type === 'texto' && textAnswers[currentQuestion].trim() === '') {
      alert('Por favor escribe una respuesta antes de continuar');
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowCommentsSection(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleBackToQuestions = () => {
    setShowCommentsSection(false);
    setCurrentQuestion(questions.length - 1);
  };

  const handleSubmit = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      if (!teacher?.id || !course?.id) {
        alert('Error: Faltan datos del profesor o curso')
        return
      }

      const answers = questions.map((q, idx) => {
        if (q.type === 'rating') {
          return {
            questionId: parseInt(q.id, 10),
            rating: ratings[idx],
            textAnswer: null
          };
        } else {
          return {
            questionId: parseInt(q.id, 10),
            rating: null,
            textAnswer: textAnswers[idx]
          };
        }
      });
      
      // Calcular rating promedio solo de las preguntas de rating
      const ratingQuestions = questions.filter(q => q.type === 'rating');
      const ratingAnswers = answers.filter(a => a.rating !== null);
      const total = ratingAnswers.reduce((a, b) => a + (b.rating || 0), 0);
      const overallRating = ratingQuestions.length > 0 ? Number((total / ratingQuestions.length).toFixed(2)) : 0;

      console.log('📤 Enviando evaluación:', {
        teacherId: String(teacher.id),
        courseId: String(course.id),
        groupId: group ? String(group.id) : undefined,
        comments,
        answers,
        overallRating,
        teacher: teacher,
        course: course,
        group: group
      })

      const result = await submitEvaluation({
        teacherId: String(teacher.id),
        courseId: String(course.id),
        groupId: group ? String(group.id) : undefined,
        comments,
        answers,
        overallRating,
      })

      console.log('✅ Evaluación enviada exitosamente:', result)
      setShowConfirmation(false)
      navigate('/evaluate/goodbye', { replace: true })
    } catch (e: any) {
      console.error('❌ Error enviando evaluación:', e)
      
      // Manejo mejorado de errores
      let errorMessage = 'Error guardando la evaluación'
      
      if (e?.response?.data?.error) {
        errorMessage = e.response.data.error
        
        // Si hay detalles de validación, mostrarlos
        if (e.response.data.details && Array.isArray(e.response.data.details)) {
          const validationErrors = e.response.data.details
            .map((detail: any) => `${detail.field}: ${detail.message}`)
            .join('\n')
          errorMessage += '\n\nDetalles:\n' + validationErrors
        }
      } else if (e?.message) {
        errorMessage = e.message
      }
      
      alert(errorMessage)
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmation(false);
  };

  // Progreso real por respuestas contestadas (modo scroll)
  const totalSteps = Math.max(questions.length, 1);
  const currentStep = questions.reduce((acc, q, idx) => {
    if (q.type === 'rating') return acc + ((ratings[idx] ?? 0) > 0 ? 1 : 0);
    return acc + ((textAnswers[idx] ?? '').trim() ? 1 : 0);
  }, 0);

  // Mostrar loading mientras se cargan las preguntas
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${fondo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-university-red mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando preguntas de evaluación</h2>
            <p className="text-gray-600">Obteniendo preguntas específicas para tu carrera...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
      <div className="relative z-10">
        <Header 
          title="Evaluación Docente - Paso 2 de 2"
          subtitle="Evalúa el desempeño del profesor"
        />

        <div className="bg-white border-b border-gray-200 py-3">
              <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <ProgressBar
              current={currentStep}
              total={totalSteps}
              label={`Responde desplazándote y luego finaliza (${currentStep}/${questions.length})`}
            />
          </div>
        </div>

        <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
          <div className="flex justify-start">
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={() => navigate(-1)}
              className="ml-2 text-lg py-2 px-4 bg-white bg-opacity-90 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a seleccionar Docente
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white shadow-lg border border-gray-200 p-6">
              <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">{teacher?.name}</h2>
                            <p className="text-md text-gray-600">{course?.name} - {course?.code}</p>
                            {course && (
                              <p className="text-sm text-university-red font-medium flex items-center gap-2">
                                <FaBook className="text-university-red" />
                                Evaluación para: {course.code} - {course.name}
                              </p>
                            )}
                          </div>
                        </div>
                
                {group && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-university-red-light rounded-lg flex items-center justify-center">
                          <span className="text-university-red font-bold text-lg">G{group.numero_grupo}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-4 mt-1">
                          {group.horario && (
                            <span className="flex item-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              <HiOutlineCalendar className="text-university-red" /> {group.horario}
                            </span>
                          )}
                          {group.aula && (
                            <span className="flex item-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              <FaRegBuilding className="text-university-red" /> 
                              {group.aula}
                            </span>
                          )}
                          {group.cup && (
                            <span className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              <FaUsers className="text-gray-600" />
                              {group.cup} cupos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Lista de preguntas (scroll) */}
            <Card className="bg-white shadow-lg border border-gray-200 p-6">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Preguntas de evaluación
                </CardTitle>
                <CardDescription className="text-xl text-gray-700 mt-2">
                  Desplázate, responde y al final finaliza la evaluación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[58vh] overflow-auto pr-2 space-y-8">
                  {questions.map((q, idx) => {
                    const rating = ratings[idx] ?? 0
                    const text = textAnswers[idx] ?? ''

                    return (
                      <div key={q.id} className="space-y-4 pb-6 border-b border-gray-100">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="text-university-red text-base font-extrabold">
                              {idx + 1}
                            </span>
                            <span className="text-gray-900">{q.category}</span>
                          </h3>
                          <p className="text-lg text-gray-700">{q.question}</p>
                        </div>

                        {q.type === 'rating' ? (
                          <>
                            <LikertScale
                              value={rating}
                              onChange={(val) => {
                                const next = [...ratings]
                                next[idx] = val
                                setRatings(next)
                              }}
                              options={5}
                              leftLabel="En desacuerdo"
                              rightLabel="De acuerdo"
                            />

                            {rating > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-2 w-full flex justify-center`}
                              >
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 ${
                                    rating >= 4
                                      ? 'bg-green-50 text-green-800 border-green-200'
                                      : rating >= 3
                                      ? 'bg-red-50 text-red-800 border-red-200'
                                      : 'bg-red-50 text-red-800 border-red-200'
                                  }`}
                                >
                                  <span>Has calificado {rating}/5</span>
                                  <span className="font-bold">{ratingLabels[rating - 1]}</span>
                                </div>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                                <FaCommentDots className="text-red-600" />
                                Esta es una pregunta abierta.
                              </p>
                            </div>

                            <textarea
                              value={text}
                              onChange={(e) => {
                                const next = [...textAnswers]
                                next[idx] = e.target.value
                                setTextAnswers(next)
                              }}
                              placeholder={q.options?.placeholder || 'Escribe tu respuesta aquí...'}
                              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                              maxLength={500}
                            />

                            <div className="text-right text-sm text-gray-500">
                              {text.length}/500 caracteres
                            </div>

                            {text.trim() && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 rounded-lg p-4"
                              >
                                <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                                  <FaCheckCircle className="text-green-600" />
                                  Respuesta guardada
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comentarios (siempre visible) */}
            <div className="mt-6">
              <Card className="bg-white shadow-lg border border-gray-200 p-6">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Comentarios Adicionales
                  </CardTitle>
                  <CardDescription className="text-xl text-gray-700 mt-2">
                    ¿Tienes algún comentario adicional sobre el desempeño del profesor? (Opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Escribe tus comentarios aquí..."
                      className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end mt-8">
                    <Button
                      onClick={handleSubmit}
                      className="bg-university-red hover:bg-university-red px-8 py-4 text-lg"
                    >
                      Finalizar Evaluación
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCancelSubmit}
        onConfirm={handleConfirmSubmit}
        title="Confirmar Evaluación"
        message="¿Estás seguro de que deseas finalizar la evaluación? Una vez enviada, no podrás modificarla."
        confirmText="Confirmar y Enviar"
        cancelText="Cancelar"
      />
    </div>
  );
}