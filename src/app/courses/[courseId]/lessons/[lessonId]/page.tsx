
import { getDoc, doc } from "firebase/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";

import { LessonVideoPlayer } from "./_components/lesson-video-player";
import { LessonContent } from "./_components/lesson-content";
import { LessonNavigation } from "./_components/lesson-navigation";

// Tipos de datos
interface LessonData {
    id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    isFree: boolean;
    moduleId: string;
}

interface EnrollmentStatus {
    isEnrolled: boolean;
}

// --- Función para obtener los datos de la lección y el estado de matriculación ---
async function getLessonData(courseId: string, lessonId: string, userId: string | null) {
    const lessonRef = doc(adminDb, "lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (!lessonSnap.exists()) {
        return notFound();
    }

    const lessonData = { id: lessonSnap.id, ...lessonSnap.data() } as LessonData;

    // Si la lección no es gratuita, debemos verificar si el usuario está matriculado
    let isEnrolled = false;
    if (!lessonData.isFree) {
        if (!userId) { // Si no hay usuario y la lección no es gratis, no puede acceder
            return { lesson: lessonData, isEnrolled: false };
        }
        const enrollmentRef = doc(adminDb, `users/${userId}/enrollments`, courseId);
        const enrollmentSnap = await getDoc(enrollmentRef);
        isEnrolled = enrollmentSnap.exists();
    }

    return { lesson: lessonData, isEnrolled };
}


// --- Componente de la Página de la Lección ---
export default async function LessonPage({ params }: { params: { courseId: string, lessonId: string } }) {
    
    const user = await adminAuth.currentUser; // Obtener el usuario actual en el servidor
    const { lesson, isEnrolled } = await getLessonData(params.courseId, params.lessonId, user?.uid || null);

    // Si la lección no es gratuita y el usuario no está matriculado, no puede verla
    const canViewContent = lesson.isFree || isEnrolled;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">Estás en el curso. ¡Sigue así!</p>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Columna principal: Contenido de la lección */}
                <div className="lg:col-span-2">
                    {canViewContent ? (
                        <div className="space-y-6">
                            <LessonVideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
                            <LessonContent description={lesson.description} />
                        </div>
                    ) : (
                        <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4 border-2 border-dashed">
                            <h2 className="text-xl font-semibold">Contenido Bloqueado</h2>
                            <p className="text-muted-foreground">Esta lección es solo para miembros matriculados.</p>
                            {/* TODO: Podríamos añadir un botón para matricularse desde aquí */}
                        </div>
                    )}
                </div>

                {/* Columna lateral: Navegación y otros */}
                <div className="lg:col-span-1">
                    {/* El componente de navegación gestionará la lógica de lección anterior/siguiente */}
                    <LessonNavigation courseId={params.courseId} currentLessonId={params.lessonId} />
                </div>

            </div>
        </div>
    );
}
