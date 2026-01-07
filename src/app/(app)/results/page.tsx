
'use client';

import React, { useMemo, useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, type DocumentData } from 'firebase/firestore';
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

  const isTeacherOrAdmin = userProfile?.role === 'TEACHER' || userProfile?.role === 'SUPER_ADMIN';

  // Query para obtener todos los estudiantes (para el filtro del profesor)
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !isTeacherOrAdmin) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'STUDENT'));
  }, [firestore, isTeacherOrAdmin]);
  const { data: students, isLoading: loadingStudents } = useCollection<DocumentData>(studentsQuery);

  // Query principal de sumisiones
  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null;
    
    const submissionsRef = collection(firestore, 'submissions');

    if (isTeacherOrAdmin) {
      if (selectedStudent === 'all') {
        return query(submissionsRef); // El admin/profesor ve todo
      }
      return query(submissionsRef, where('studentId', '==', selectedStudent));
    }

    // El estudiante solo ve lo suyo
    return query(submissionsRef, where('studentId', '==', userProfile.uid));

  }, [firestore, userProfile, isTeacherOrAdmin, selectedStudent]);

  const { data: submissions, isLoading: loadingSubmissions, error } = useCollection<DocumentData>(submissionsQuery);
  
  const isLoading = loadingProfile || loadingSubmissions || (isTeacherOrAdmin && loadingStudents);

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
        <AlertDescription>No se pudieron cargar los datos de las sumisiones. Error: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Resultados y Calificaciones</h1>
        {isTeacherOrAdmin && (
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
            {isTeacherOrAdmin ? 'Revisa las sumisiones de los estudiantes.' : 'Aquí puedes ver un historial de tus envíos y las calificaciones obtenidas.'}
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
                            {isTeacherOrAdmin && (
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
                  {isTeacherOrAdmin ? 'Cuando un estudiante envíe un desafío, sus resultados aparecerán aquí.' : 'Los resultados de tus desafíos aparecerán aquí después de que los envíes.'}
                </p>
              </div>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
