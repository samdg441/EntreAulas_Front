import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CardHeader, 
  CardContent, 
  CardDescription, 
  CardTitle 
} from '../components/Card';
import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import { User } from '../types';
import { 
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { fetchTeacherInfo, fetchSurveyByCareer, debugUserInfo, debugAuth } from '../api/teachers';

// Importar la imagen de fondo
const fondo = new URL('../assets/fondo.webp', import.meta.url).href;

interface SurveyViewProps {
  user: User;
}

interface Question {
  id: string;
  category: string;
  question: string;
  type: string;
  options?: any;
}

interface SurveyData {
  careerId: number | null;
  career: {
    id: number;
    nombre: string;
  } | null;
  questions: Question[];
}

export default function SurveyView({ user }: SurveyViewProps) {
  const navigate = useNavigate();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null);

  useEffect(() => {
    loadSurveyData();
  }, []);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primero obtener información de debug de autenticación
      try {
        const authDebug = await debugAuth();
        setAuthDebugInfo(authDebug);
        console.log('🔍 Auth Debug info:', authDebug);
      } catch (authDebugErr) {
        console.error('❌ Error getting auth debug info:', authDebugErr);
      }

      // Luego obtener información de debug del usuario
      try {
        const debug = await debugUserInfo();
        setDebugInfo(debug);
        console.log('🔍 Debug info:', debug);
      } catch (debugErr) {
        console.error('❌ Error getting debug info:', debugErr);
      }

      // Obtener información del profesor para saber su carrera
      const teacherInfo = await fetchTeacherInfo();
      console.log('🔍 Teacher info:', teacherInfo);

      if (!teacherInfo.carreraId) {
        throw new Error('No se pudo determinar la carrera del profesor');
      }

      // Obtener la encuesta para la carrera del profesor
      const survey = await fetchSurveyByCareer(teacherInfo.carreraId.toString());
      console.log('🔍 Survey data:', survey);

      setSurveyData(survey);
    } catch (err) {
      console.error('❌ Error loading survey data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case 'escala_likert':
        return 'Escala Likert (1-5)';
      case 'multiple_choice':
        return 'Opción múltiple';
      case 'texto_libre':
        return 'Texto libre';
      case 'si_no':
        return 'Sí/No';
      default:
        return type;
    }
  };

  const getOptionsDisplay = (options: any) => {
    if (!options) return 'Sin opciones';
    
    if (Array.isArray(options)) {
      return options.join(', ');
    }
    
    if (typeof options === 'object') {
      return Object.values(options).join(', ');
    }
    
    return String(options);
  };

  if (loading) {
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
        
        {/* Contenido de carga */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Cargando encuesta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        
        {/* Contenido principal */}
        <div className="relative z-10">
          <Header user={user} />
          <main className="max-w-4xl mx-auto p-6">
            <Card className="bg-white shadow-md border border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-800">Error al cargar la encuesta</h2>
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                
                {authDebugInfo && (
                  <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
                    <h4 className="font-semibold mb-2">Debug de Autenticación:</h4>
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(authDebugInfo, null, 2)}
                    </pre>
                  </div>
                )}
                
                {debugInfo && (
                  <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold mb-2">Información de Debug del Usuario:</h4>
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                )}
                
                <Button onClick={handleGoBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

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
      
      {/* Contenido principal */}
      <div className="relative z-10">
        <Header user={user} />
        
        <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-red-600" />
                  <div>
                    <CardTitle className="text-2xl text-gray-900">Encuesta de Evaluación</CardTitle>
                    <CardDescription className="text-base">
                      {surveyData?.career?.nombre || 'Carrera no especificada'}
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={handleGoBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Información de la encuesta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Información de la Encuesta</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Carrera</p>
                  <p className="text-gray-900">{surveyData?.career?.nombre || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Preguntas</p>
                  <p className="text-gray-900">{surveyData?.questions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preguntas de la encuesta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900">Preguntas de la Encuesta</CardTitle>
              <CardDescription>
                Estas son las preguntas que los estudiantes responden en la evaluación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {surveyData?.questions?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay preguntas disponibles para esta carrera</p>
                </div>
              ) : (
                surveyData?.questions?.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {question.category}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {getQuestionTypeDisplay(question.type)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                        {question.options && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-1">Opciones:</p>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                              {getOptionsDisplay(question.options)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
        </main>
      </div>
    </div>
  );
}
