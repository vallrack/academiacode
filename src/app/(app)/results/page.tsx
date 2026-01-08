'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, type DocumentData, onSnapshot } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, Star, User } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

// Componente para el Gráfico de Habilidades
function SkillsChart({ submissions }: { submissions: DocumentData[] }) {
  const skillsData = useMemo(() => {
    const skillCounts: { [key: string]: number } = {};
    submissions.forEach(sub => {
      sub.developedSkills?.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    return Object.entries(skillCounts).map(([name, count]) => ({ name, count }));
  }, [submissions]);

  if (skillsData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No hay suficientes datos de habilidades para mostrar un gráfico.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={skillsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="hsl(var(--primary))" name="Frecuencia" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ResultsPage() {
  const { userProfile, loadingProfile } = useUserProfile();
  const firestore = useFirestore();
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  
  const [students, setStudents] = useState<DocumentData[]>([]);
  const [submissions, setSubmissions] = useState<DocumentData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isTeacher = userProfile?.role === 'TEACHER';
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const teacherManagedGroups = userProfile?.managedGroupIds || [];

  useEffect(() => {
    if (loadingProfile) {
        setIsLoading(true);
        return;
    }
    if (!userProfile || !firestore) {
        setIsLoading(false);
        setError(new Error("No se pudo cargar el perfil del usuario o la base de datos."));
        return;
    }

    const unsubscribes: (() => void)[] = [];
    let dependenciesLoaded = 0;
    const requiredDependencies = isTeacher || isSuperAdmin ? 1 : 0; // Students for filters

    const checkAllDependenciesLoaded = () => {
        dependenciesLoaded++;
        if (dependenciesLoaded >= requiredDependencies) {
            loadSubmissions();
        }
    };

    if (isTeacher || isSuperAdmin) {
        let studentsQuery;
        const usersCollection = collection(firestore, 'users');
        if (isSuperAdmin) {
            studentsQuery = query(usersCollection, where('role', '==', 'STUDENT'));
        } else if (isTeacher && teacherManagedGroups.length > 0) {
            studentsQuery = query(usersCollection, where('role', '==', 'STUDENT'), where('groupId', 'in', teacherManagedGroups));
        } else {
            setStudents([]);
            checkAllDependenciesLoaded();
        }

        if (studentsQuery) {
            const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
                setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                if (dependenciesLoaded === 0) checkAllDependenciesLoaded();
            }, (err) => {
                setError(err);
                setIsLoading(false);
            });
            unsubscribes.push(unsubStudents);
        }
    } else {
        loadSubmissions();
    }
    
    function loadSubmissions() {
        let submissionsQuery;
        const submissionsRef = collection(firestore, 'submissions');

        if (isSuperAdmin) {
            submissionsQuery = selectedStudent === 'all' 
                ? query(submissionsRef) 
                : query(submissionsRef, where('studentId', '==', selectedStudent));
        } else if (isTeacher) {
            const studentIdsInManagedGroups = students.map(s => s.id);
            if (studentIdsInManagedGroups.length === 0) {
              setSubmissions([]);
              setIsLoading(false);
              return;
            }
            if (selectedStudent === 'all') {
                // Firestore 'in' queries are limited to 30 values. If more, we might need a different approach.
                // For now, this is fine for typical class sizes.
                submissionsQuery = query(submissionsRef, where('studentId', 'in', studentIdsInManagedGroups.slice(0, 30)));
            } else if (studentIdsInManagedGroups.includes(selectedStudent)) {
                submissionsQuery = query(submissionsRef, where('studentId', '==', selectedStudent));
            } else {
              // This case happens if a student filter is selected that the teacher should not see.
              // We create a query that returns nothing.
              submissionsQuery = query(submissionsRef, where('studentId', '==', 'invalid-id-for-query'));
            }
        } else { // Student
            submissionsQuery = query(submissionsRef, where('studentId', '==', userProfile.uid));
        }

        if (submissionsQuery) {
            const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
                setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setError(null);
                setIsLoading(false);
            }, (err) => {
                setError(err);
                setIsLoading(false);
            });
            unsubscribes.push(unsubSubmissions);
        } else {
            setIsLoading(false);
        }
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [firestore, userProfile, loadingProfile, selectedStudent]);


  const getGradeColor = (grade: number) => {
    if (grade >= 4.5) return 'text-green-600';
    if (grade >= 4) return 'text-blue-600';
    if (grade >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const formatDateSafe = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, "d MMM yyyy, HH:mm", { locale: es });
    } catch (e) {
        console.error("Could not format date:", timestamp);
        return "Fecha inválida";
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al Cargar Resultados</AlertTitle>
        <AlertDescription>No se pudieron cargar los datos. Esto puede ser un problema de permisos o de conexión. Intenta recargar la página. <br /><span className="text-xs mt-2 block">{error.message}</span></AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Resultados y Calificaciones</h1>
        {(isTeacher || isSuperAdmin) && (
          <div className="grid gap-2 w-full sm:max-w-xs">
            <Label htmlFor="student-filter">Filtrar por Estudiante</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student-filter">
                <SelectValue placeholder="Seleccionar estudiante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estudiantes</SelectItem>
                {students?.map(student => (
                  <SelectItem key={student.id} value={student.id}>{student.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Análisis de Habilidades
          </CardTitle>
          <CardDescription>Frecuencia de habilidades demostradas en los desafíos completados.</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <SkillsChart submissions={submissions} />
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <p>No hay datos de sumisiones para generar el gráfico.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Sumisiones</CardTitle>
          <CardDescription>
            {(isTeacher || isSuperAdmin) ? 'Revisa las sumisiones de los estudiantes.' : 'Aquí puedes ver un historial de tus envíos y las calificaciones obtenidas.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {submissions && submissions.length > 0 ? (
             <Accordion type="single" collapsible className="w-full">
               {submissions.map(sub => (
                 <AccordionItem value={sub.id} key={sub.id}>
                   <AccordionTrigger>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-4">
                        <div className="grid gap-1 text-left">
                            <p className="font-semibold">{sub.challengeTitle}</p>
                            {(isTeacher || isSuperAdmin) && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    <span>{students?.find(s => s.id === sub.studentId)?.displayName || 'Estudiante desconocido'}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 sm:mt-0">
                           <span className="text-xs text-muted-foreground">
                             {formatDateSafe(sub.submissionDate)}
                           </span>
                           <div className={`flex items-center gap-1.5 font-bold text-lg ${getGradeColor(sub.grade)}`}>
                             <Star className="w-5 h-5" />
                             <span>{sub.grade.toFixed(1)}</span>
                           </div>
                        </div>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent>
                     <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 p-4 bg-muted/50 rounded-md">
                        <h4 className="font-semibold">Informe de la IA</h4>
                        <p>{sub.report}</p>
                        <h4 className="font-semibold">Habilidades Demostradas</h4>
                        <div className="flex flex-wrap gap-2">
                            {sub.developedSkills.map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                     </div>
                   </AccordionContent>
                 </AccordionItem>
               ))}
             </Accordion>
           ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
              <div className="flex flex-col items-center gap-1 text-center px-4">
                <h3 className="text-2xl font-bold tracking-tight">
                  No hay resultados para mostrar
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(isTeacher || isSuperAdmin) ? 'Cuando un estudiante envíe un desafío, sus resultados aparecerán aquí.' : 'Los resultados de tus desafíos aparecerán aquí después de que los envíes.'}
                </p>
              </div>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
