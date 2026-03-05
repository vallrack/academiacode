
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/server";
import { CourseCard } from "./_components/course-card";

// Tipos de datos
interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    teacherId: string; // Podríamos usarlo para mostrar el nombre del docente en el futuro
}

// --- Función para obtener todos los cursos publicados ---
async function getPublishedCourses() {
    const coursesRef = collection(db, "courses");
    // Creamos una consulta que filtra por `isPublished: true` y ordena por fecha de creación
    const q = query(coursesRef, where("isPublished", "==", true), orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(q);
    
    const courses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as Course[];

    return courses;
}

// --- Componente de la Página del Catálogo de Cursos ---
export default async function CoursesPage() {
    const courses = await getPublishedCourses();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Explora Nuestros Cursos</h1>
            
            {courses.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <CourseCard 
                            key={course.id}
                            course={course}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold">No hay cursos disponibles</h2>
                    <p className="text-muted-foreground mt-2">Pronto publicaremos nuevo contenido. ¡Vuelve a visitarnos!</p>
                </div>
            )}
        </div>
    );
}
