
import { getDoc, doc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/server";
import { notFound } from "next/navigation";

import { CourseHeader } from "./_components/course-header";
import { CourseContent } from "./_components/course-content";

// Tipos de datos
interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  teacherId: string;
  isPublished: boolean;
}

interface TeacherData {
  name: string;
}

interface ModuleData {
  id: string;
  title: string;
  order: number;
  lessons: LessonData[];
}

interface LessonData {
  id: string;
  title: string;
  order: number;
  isFree: boolean;
}

// Función para obtener los datos del curso
async function getCourse(courseId: string) {
  const courseRef = doc(db, "courses", courseId);
  const courseSnap = await getDoc(courseRef);

  if (!courseSnap.exists() || !courseSnap.data().isPublished) {
    return notFound(); // Si el curso no existe o no está publicado, 404
  }

  const courseData = { id: courseSnap.id, ...courseSnap.data() } as CourseData;

  // Obtener docente
  const teacherRef = doc(db, "users", courseData.teacherId);
  const teacherSnap = await getDoc(teacherRef);
  const teacherData = teacherSnap.exists() ? (teacherSnap.data() as TeacherData) : { name: "Docente no encontrado" };

  // Obtener módulos y lecciones
  const modulesQuery = query(collection(db, "modules"), where("courseId", "==", courseId), orderBy("order"));
  const modulesSnap = await getDocs(modulesQuery);
  const modules: ModuleData[] = [];

  for (const moduleDoc of modulesSnap.docs) {
    const moduleData = { id: moduleDoc.id, ...moduleDoc.data() } as Omit<ModuleData, 'lessons'>;
    
    const lessonsQuery = query(collection(db, "lessons"), where("moduleId", "==", moduleDoc.id), orderBy("order"));
    const lessonsSnap = await getDocs(lessonsQuery);
    const lessons = lessonsSnap.docs.map(lessonDoc => ({ id: lessonDoc.id, ...lessonDoc.data() } as LessonData));
    
    modules.push({ ...moduleData, lessons });
  }

  return { course: courseData, teacher: teacherData, modules };
}

// Página del Curso
export default async function CoursePage({ params }: { params: { courseId: string } }) {
  const { course, teacher, modules } = await getCourse(params.courseId);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabecera del Curso */}
      <CourseHeader 
        title={course.title} 
        description={course.description} 
        teacherName={teacher.name} 
        imageUrl={course.thumbnailUrl}
        courseId={course.id}
      />
      
      <hr className="my-8" />

      {/* Contenido del Curso (Módulos y Lecciones) */}
      <CourseContent modules={modules} courseId={course.id} />
    </div>
  );
}
