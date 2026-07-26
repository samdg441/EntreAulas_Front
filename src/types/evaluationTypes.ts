// Tipos compartidos para evaluaciones entre frontend y backend

export interface EvaluationRequest {
  teacherId: string;
  courseId: string;
  groupId?: string;
  answers: EvaluationAnswer[];
  overallRating: number;
  comments?: string;
}

export interface EvaluationAnswer {
  questionId: number;
  rating?: number | null;
  textAnswer?: string | null;
  selectedOption?: string | null;
}

export interface EvaluationResponse {
  success: boolean;
  message: string;
  evaluationId: string;
}

export interface EvaluationError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface EvaluationQuestion {
  id: number;
  categoria_id: number;
  texto_pregunta: string;
  descripcion?: string;
  tipo_pregunta: string;
  opciones?: any;
  obligatoria: boolean;
  orden: number;
  activa: boolean;
  id_carrera?: number;
  categoria: {
    id: number;
    nombre: string;
    descripcion?: string;
    orden: number;
  };
}

export interface SavedEvaluation {
  id: string;
  estudiante_id: string;
  profesor_id: string;
  grupo_id: number;
  periodo_id: number;
  completada: boolean;
  comentarios?: string;
  calificacion_promedio?: number;
  fecha_inicio: string;
  fecha_completada?: string;
  fecha_creacion: string;
}

export interface SavedEvaluationResponse {
  id: string;
  evaluacion_id: string;
  pregunta_id: number;
  respuesta_rating?: number;
  respuesta_texto?: string;
  respuesta_opcion?: string;
}
