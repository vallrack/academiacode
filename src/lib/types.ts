
import { Timestamp } from 'firebase/firestore';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: Timestamp;
}

export interface Course {
  id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  teacherId: string;
  groupId?: string;
  isPublished: boolean;
}

export interface Module {
  id?: string;
  courseId: string;
  title: string;
  order: number;
}

export interface Lesson {
  id?: string;
  courseId: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl?: string;
  documentUrl?: string;
  challengeId?: string;
  isFree: boolean;
  order: number;
}

export interface Group {
  id?: string;
  name: string;
  teacherId: string;
  createdAt: Timestamp;
}

export interface Enrollment {
  id?: string;
  userId: string;
  courseId: string;
  enrollmentDate: Timestamp;
}

export interface UserProgress {
  id?: string;
  lessonId: string;
  completedAt: Timestamp;
}
