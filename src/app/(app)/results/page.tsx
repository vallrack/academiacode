
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, type DocumentData, onSnapshot, type Query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, Star, User, Filter } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

// Types for clarity
type GroupSchedule = {
  days: string[];
  startTime: string;
  endTime: string;
};

type Group = { 
  id: string; 
  name: string;
  schedule: GroupSchedule | string;
};

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
  const { toast } = useToast();
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [students, setStudents] = useState<DocumentData[]>([]);
  const [groups, setGroups] = useState<DocumentData[]>([]);
  const [submissions, setSubmissions] = useState<DocumentData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = userProfile?.role === 'TEACHER';
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const canManage = isSuperAdmin || isTeacher;

  // Effect for fetching filter data (groups and students for privileged users)
  useEffect(() => {
    if (!firestore || !canManage) {
      setStudents([]);
      setGroups([]);
      return;
    }
    
    let unsubGroups: (() => void) | null = null;
    let unsubStudents: (() => void) | null = null;

    try {
        const groupsQuery = query(collection(firestore, 'groups'));
        unsubGroups = onSnapshot(groupsQuery, (snapshot) => {
            setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }, (err) => console.error("Error fetching groups:", err));
    
        const studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'STUDENT'));
        unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }, (err) => console.error("Error fetching students:", err));
    } catch(e) {
        console.error('Error setting up filter listeners:', e);
    }

    return () => {
      if (unsubGroups) try { unsubGroups(); } catch(e) { console.warn('Error during groups unsubscribe:', e); }
      if (unsubStudents) try { unsubStudents(); } catch(e) { console.warn('Error during students unsubscribe:', e); }
    };
  }, [firestore, canManage]);


  // Effect for fetching submissions
  useEffect(() => {
    if (loadingProfile || !firestore || !userProfile) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    let unsubscribe: (() => void) | null = null;

    try {
        const submissionsQuery = query(collection(firestore, 'submissions'));
        
        unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
            setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setError(null);
            setIsLoading(false);
        }, (err: any) => {
            if (err.message.includes('INTERNAL ASSERTION')) {
                console.warn('Firestore internal assertion failure ignored in submissions listener.');
            } else {
                setError(err.message);
                setIsLoading(false);
                toast({ variant: "destructive", title: "Error", description: err.message });
            }
        });
    } catch(e: any) {
        console.error('Error setting up submissions listener:', e);
        setError(e.message);
        setIsLoading(false);
    }

    return () => {
        if (unsubscribe) {
            try { unsubscribe(); } catch(e) { console.warn('Error during submissions unsubscribe:', e); }
        }
    };
  }, [firestore, userProfile, loadingProfile, toast]);


  // Client-side filtering logic
  const filteredSubmissions = useMemo(() => {
    let finalSubmissions = submissions;

    if (userProfile?.role === 'STUDENT') {
        return finalSubmissions.filter(sub => sub.studentId === userProfile.uid)
            .sort((a, b) => (b.submissionDate?.toMillis() || 0) - (a.submissionDate?.toMillis() || 0));
    }

    if (canManage) {
        const teacherManagedGroups = userProfile?.managedGroupIds || [];
        
        // Filter by teacher's managed groups if the user is a teacher
        if (isTeacher) {
            const studentIdsInManagedGroups = new Set(students.filter(s => teacherManagedGroups.includes(s.groupId)).map(s => s.id));
            finalSubmissions = finalSubmissions.filter(sub => studentIdsInManagedGroups.has(sub.studentId));
        }

        // Apply UI filters
        if (selectedGroupId) {
          const studentIdsInGroup = new Set(students.filter(s => s.groupId === selectedGroupId).map(s => s.id));
          finalSubmissions = finalSubmissions.filter(sub => studentIdsInGroup.has(sub.studentId));
        } else if (selectedStudentId) {
          finalSubmissions = finalSubmissions.filter(sub => sub.studentId === selectedStudentId);
        }
    }
    
    return finalSubmissions.sort((a, b) => (b.submissionDate?.toMillis() || 0) - (a.submissionDate?.toMillis() || 0));
  }, [selectedStudentId, selectedGroupId, submissions, students, canManage, userProfile, isTeacher]);

  const handleClearFilters = () => {
    setSelectedGroupId('');
    setSelectedStudentId('');
  };

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
  
  const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') return schedule;
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
  };


  if (isLoading || loadingProfile) {
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
        <AlertDescription>No se pudieron cargar los datos. Esto puede ser un problema de permisos o de conexión. Intenta recargar la página. <br /><span className="text-xs mt-2 block">{error}</span></AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Resultados y Calificaciones</h1>
      </div>
      
       {canManage && (
        <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-muted-foreground"/>
                <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="group-filter">Filtrar por Grupo</Label>
                    <Select value={selectedGroupId} onValueChange={value => { setSelectedGroupId(value); setSelectedStudentId(''); }}>
                        <SelectTrigger id="group-filter"><SelectValue placeholder="Todos los grupos" /></SelectTrigger>
                        <SelectContent>
                            {groups?.map(group => <SelectItem key={group.id} value={(group as Group).id}>{(group as Group).name} - {formatSchedule((group as Group).schedule)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="student-filter">Filtrar por Estudiante</Label>
                    <Select value={selectedStudentId} onValueChange={value => { setSelectedStudentId(value); setSelectedGroupId(''); }}>
                        <SelectTrigger id="student-filter"><SelectValue placeholder="Todos los estudiantes" /></SelectTrigger>
                        <SelectContent>
                            {students?.map(student => <SelectItem key={student.id} value={student.id}>{student.displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                    <Button variant="outline" onClick={handleClearFilters} className="w-full">Limpiar Filtros</Button>
                </div>
            </div>
        </div>
      )}


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Análisis de Habilidades
          </CardTitle>
          <CardDescription>Frecuencia de habilidades demostradas en los desafíos completados.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions && filteredSubmissions.length > 0 ? (
            <SkillsChart submissions={filteredSubmissions} />
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
            {canManage ? 'Revisa las sumisiones de los estudiantes.' : 'Aquí puedes ver un historial de tus envíos y las calificaciones obtenidas.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {filteredSubmissions && filteredSubmissions.length > 0 ? (
             <Accordion type="single" collapsible className="w-full">
               {filteredSubmissions.map(sub => (
                 <AccordionItem value={sub.id} key={sub.id}>
                   <AccordionTrigger>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-4">
                        <div className="grid gap-1 text-left">
                            <p className="font-semibold">{sub.challengeTitle}</p>
                            {canManage && (
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
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{sub.report}</pre>
                        
                        {sub.screenRecordingUri && (
                          <>
                            <h4 className="font-semibold">Grabación de Pantalla</h4>
                            <video controls src={sub.screenRecordingUri} className="w-full rounded-md" />
                          </>
                        )}

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
                  {canManage ? 'Cuando un estudiante envíe un desafío, sus resultados aparecerán aquí.' : 'Los resultados de tus desafíos aparecerán aquí después de que los envíes.'}
                </p>
              </div>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
