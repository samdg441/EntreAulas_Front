export type UserType = 'student' | 'teacher' | 'coordinator' | 'decano';

export interface User {
  id: string;
  name: string;
  type: UserType;
  email: string;
  roles?: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  schedule: string;
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  courses: Course[];
}

export interface Evaluation {
  id: string;
  teacherId: string;
  courseId: string;
  studentId: string;
  date: Date;
  answers: EvaluationAnswer[];
  completed: boolean;
  comments?: string;
  overallRating: number;
}

export interface EvaluationAnswer {
  questionId: number;
  rating: number;
  comment?: string;
}

export interface EvaluationQuestion {
  id: string;
  category: string;
  text: string;
  description?: string;
  type: 'rating' | 'text' | 'multipleChoice';
  options?: string[];
  required: boolean;
  order: number;
  carreraId?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: Date;
  read: boolean;
  link?: string;
}

export interface Department {
  id: string;
  name: string;
  headTeacherId?: string;
  totalTeachers: number;
}

export interface Stats {
  evaluationsPending: number;
  evaluationsCompleted: number;
  currentCourses: number;
  averageRating?: number;
  totalEvaluations?: number;
  coursesTeaching?: number;
  pendingReviews?: number;
  totalTeachers?: number;
  pendingApprovals?: number;
}

export interface BaseEvaluation {
  id: number;
  course: string;
  deadline: string;
}

export interface StudentEvaluation extends BaseEvaluation {
  teacher: string;
}

export interface TeacherEvaluation extends BaseEvaluation {
  period: string;
}

export interface CoordinatorEvaluation extends BaseEvaluation {
  period: string;
}

export type EvaluationItem = StudentEvaluation | TeacherEvaluation | CoordinatorEvaluation;