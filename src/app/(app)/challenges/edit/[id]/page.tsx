
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  type DocumentData,
  type Query,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/firebase/auth/use-user';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { useUserProfile } from '@/contexts/user-profile-context';

export const dynamic = 'force-dynamic';

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
type Student = { id: string; displayName: string, role: string, email: string };

export default function EditChallengePage() {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState('');
  const [allowInteractive, setAllowInteractive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Assignment state
  const [targetGroup, setTargetGroup] = useState('');
  const [targetStudent, setTargetStudent] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isAssigning, setIsAssigning] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { id: challengeId } = params;

  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { userProfile } = useUserProfile();

  const [groups, setGroups] = useState<DocumentData[] | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [students, setStudents] = useState<DocumentData[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const isTeacher = userProfile?.role === 'TEACHER';
  const teacherManagedGroups = userProfile?.managedGroupIds || [];

  useEffect(() => {
    if (!firestore || !userProfile) {
        setLoadingGroups(false);
        setLoadingStudents(false);
        return;
    }

    // Fetch Groups
    let groupsQuery: Query | null = null;
    const groupsCollection = collection(firestore, 'groups');
    if (isSuperAdmin) {
        groupsQuery = groupsCollection as Query<Group & DocumentData>;
    } else if (isTeacher && teacherManagedGroups.length > 0) {
        groupsQuery = query(groupsCollection, where('__name__', 'in', teacherManagedGroups));
    }
    
    if(groupsQuery) {
        const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
            setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingGroups(false);
        }, () => setLoadingGroups(false));
        
        return () => unsubscribeGroups();
    } else {
        setGroups([]);
        setLoadingGroups(false);
    }
  }, [firestore, userProfile, isSuperAdmin, isTeacher, teacherManagedGroups]);

  useEffect(() => {
    if (!firestore || !userProfile) {
        setLoadingStudents(false);
        return;
    }
      
    // Fetch Students
    let studentsQuery: Query | null = null;
    const usersCollection = collection(firestore, 'users');
    if (isSuperAdmin) {
        studentsQuery = query(usersCollection, where('role', '==', 'STUDENT')) as Query<Student & DocumentData>;
    } else if (isTeacher && teacherManagedGroups.length > 0) {
        studentsQuery = query(usersCollection, where('role', '==', 'STUDENT'), where('groupId', 'in', teacherManagedGroups)) as Query<Student & DocumentData>;
    }
    
    if(studentsQuery) {
        const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingStudents(false);
        }, () => setLoadingStudents(false));
        
        return () => unsubscribeStudents();
    } else {
        setStudents([]);
        setLoadingStudents(false);
    }
  }, [firestore, userProfile, isSuperAdmin, isTeacher, teacherManagedGroups]);


  useEffect(() => {
    if (!firestore || !challengeId) return;

    const fetchChallenge = async () => {
      setLoading(true);
      const challengeDocRef = doc(firestore, 'challenges', Array.isArray(challengeId) ? challengeId[0] : challengeId);
      try {
        const challengeDocSnap = await getDoc(challengeDocRef);
        if (challengeDocSnap.exists()) {
          const data = challengeDocSnap.data();
          setTitle(data.title || '');
          setLanguage(data.language || '');
          setCategory(data.category || '');
          setDescription(data.description || '');
          setTestCases(data.testCases || '');
          setAllowInteractive(data.allowInteractiveApis || false);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el desafío.' });
          router.push('/challenges');
        }
      } catch (error) {
        console.error('Error fetching challenge:', error);
        toast({ variant: 'destructive', title: 'Error al Cargar', description: 'No se pudieron cargar los datos del desafío.' });
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [firestore, challengeId, toast, router]);

  const handleUpdate = async () => {
    if (!firestore || !challengeId || !user) return;

    if (!title || !description || !language || !category) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: 'Completa todos los campos.' });
      return;
    }

    setIsSaving(true);
    const challengeDocRef = doc(firestore, 'challenges', Array.isArray(challengeId) ? challengeId[0] : challengeId);

    try {
      await updateDoc(challengeDocRef, {
        title,
        description,
        language,
        category,
        testCases,
        allowInteractiveApis: allowInteractive,
      });
      toast({ title: '¡Desafío Actualizado!', description: `El desafío "${title}" ha sido actualizado.` });
      // No redirigir para poder asignar
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({ variant: 'destructive', title: 'Error al Actualizar', description: 'No se pudo actualizar el desafío.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!challengeId || (!targetGroup && !targetStudent) || !dueDate) {
        toast({
            variant: "destructive",
            title: "Campos Incompletos",
            description: "Debes seleccionar un grupo o un estudiante y una fecha de entrega.",
        });
        return;
    }

    if (!firestore || !user) return;

    setIsAssigning(true);
    
    const assignmentData = {
        challengeId: Array.isArray(challengeId) ? challengeId[0] : challengeId,
        challengeTitle: title, // Denormalize title
        targetId: targetGroup || targetStudent,
        targetType: targetGroup ? 'group' : 'student',
        dueDate,
        assignedBy: user.uid,
        assignedAt: serverTimestamp(),
    };

    try {
        const assignmentsCollection = collection(firestore, 'assignments');
        await addDoc(assignmentsCollection, assignmentData);
        toast({
            title: "¡Desafío Asignado!",
            description: `Asignado a ${targetGroup ? `grupo` : `estudiante`} para el ${format(dueDate, 'PPP', { locale: es })}.`
        });
        setTargetGroup('');
        setTargetStudent('');
        setDueDate(undefined);

    } catch (error) {
        console.error("Error creating assignment:", error);
        toast({
            variant: "destructive",
            title: "Error al Asignar",
            description: "No se pudo crear la asignación. Verifica tus permisos.",
        });
    } finally {
        setIsAssigning(false);
    }
  }

  const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') {
      return schedule;
    }
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/challenges">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Modificar Desafío
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Desafío</CardTitle>
              <CardDescription>Modifica el contenido y la configuración del desafío.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="language">Lenguaje</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="sql">SQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="csharp">C#</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                        <SelectItem value="swift">Swift</SelectItem>
                        <SelectItem value="kotlin">Kotlin</SelectItem>
                        <SelectItem value="php">PHP</SelectItem>
                        <SelectItem value="ruby">Ruby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3">
                  <Label htmlFor="category">Categoría</Label>
                  <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ej. Semana 1"/>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32"/>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="test-cases">Casos de Prueba (JSON)</Label>
                <Textarea id="test-cases" value={testCases} onChange={(e) => setTestCases(e.target.value)} className="min-h-32 font-mono"/>
              </div>
              <div className="flex items-center space-x-2">
                  <Switch id="interactive-mode" checked={allowInteractive} onCheckedChange={setAllowInteractive} />
                  <Label htmlFor="interactive-mode">Permitir APIs interactivas (ej. prompt, alert)</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Asignar Desafío</CardTitle>
                    <CardDescription>Asigna este desafío a un grupo o a un estudiante individual con una fecha de entrega.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="target-group">Asignar a Grupo</Label>
                        {loadingGroups ? <Skeleton className="h-10 w-full" /> : (
                            <Select value={targetGroup} onValueChange={(value) => { setTargetGroup(value); setTargetStudent(''); }}>
                                <SelectTrigger id="target-group"><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                                <SelectContent>
                                    {groups?.map(group => <SelectItem key={group.id} value={(group as Group).id}>{(group as Group).name} - {formatSchedule((group as Group).schedule)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="target-student">Asignar a Estudiante</Label>
                        {loadingStudents ? <Skeleton className="h-10 w-full" /> : (
                            <Select value={targetStudent} onValueChange={(value) => { setTargetStudent(value); setTargetGroup(''); }}>
                                <SelectTrigger id="target-student"><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
                                <SelectContent>
                                    {students?.map(student => <SelectItem key={student.id} value={(student as Student).id}>{(student as Student).displayName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="grid gap-3">
                        <Label>Fecha de Entrega</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleAssign} disabled={isAssigning}>
                        {isAssigning ? "Asignando..." : "Asignar"}
                    </Button>
                </CardContent>
            </Card>
        </div>

      </div>
      <div className="flex items-center justify-center gap-2 md:hidden">
        <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}

    

    

    