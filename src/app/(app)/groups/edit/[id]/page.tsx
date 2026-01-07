
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/contexts/user-profile-context';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Student = {
  id: string;
  displayName: string;
  email: string;
};

export default function EditGroupPage() {
  const { userProfile } = useUserProfile();
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id: groupId } = params;
  
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return query(
      collection(firestore, 'users'),
      where('groupId', '==', Array.isArray(groupId) ? groupId[0] : groupId)
    ) as Query<Student & DocumentData>;
  }, [firestore, groupId]);

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery);

  useEffect(() => {
    if (!firestore || !groupId) return;

    const fetchGroup = async () => {
      setLoading(true);
      const groupDocRef = doc(firestore, 'groups', Array.isArray(groupId) ? groupId[0] : groupId);
      try {
        const docSnap = await getDoc(groupDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          if (data.schedule && typeof data.schedule === 'object') {
            setStartTime(data.schedule.startTime || '');
            setEndTime(data.schedule.endTime || '');
            const daysMap = (data.schedule.days || []).reduce((acc: Record<string, boolean>, day: string) => {
              acc[day] = true;
              return acc;
            }, {});
            setSelectedDays(daysMap);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo encontrar el grupo.',
          });
          router.push('/groups');
        }
      } catch (error) {
        console.error("Error fetching group:", error);
        toast({
          variant: "destructive",
          title: "Error al Cargar",
          description: "No se pudieron cargar los datos del grupo.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [firestore, groupId, toast, router]);

  const handleDayChange = (day: string) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleUpdate = async () => {
    if (!isSuperAdmin) {
        toast({ variant: 'destructive', title: 'Permiso Denegado', description: 'No tienes permiso para realizar esta acción.' });
        return;
    }

    const finalSelectedDays = Object.keys(selectedDays).filter(day => selectedDays[day]);
    if (!name || finalSelectedDays.length === 0 || !startTime || !endTime) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'Por favor, completa el nombre, al menos un día y las horas de inicio/fin.',
      });
      return;
    }

    if (!firestore || !groupId) return;

    setIsSaving(true);
    const groupDocRef = doc(firestore, 'groups', Array.isArray(groupId) ? groupId[0] : groupId);

    try {
      await updateDoc(groupDocRef, {
        name,
        schedule: {
          days: finalSelectedDays,
          startTime,
          endTime,
        },
      });
      toast({
        title: '¡Grupo Actualizado!',
        description: `El grupo "${name}" ha sido actualizado correctamente.`,
      });
      router.push('/groups');
    } catch (error) {
      console.error("Error updating group:", error);
      toast({
        variant: "destructive",
        title: "Error al Actualizar",
        description: "No se pudo actualizar el grupo.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasStudents = !loadingStudents && students && students.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/groups">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {isSuperAdmin ? 'Modificar Grupo' : 'Detalles del Grupo'}
        </h1>
        {isSuperAdmin && (
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/groups">Cancelar</Link>
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Detalles del Grupo</CardTitle>
                <CardDescription>
                    {isSuperAdmin ? 'Modifica los detalles del grupo y su horario.' : 'Información del grupo y su horario.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid gap-6">
                    <div className="grid gap-3">
                    <Label htmlFor="name">Nombre del Grupo</Label>
                    <Input
                        id="name"
                        type="text"
                        className="w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isSuperAdmin}
                    />
                    </div>
                    <div className="grid gap-3">
                    <Label>Días de la Semana</Label>
                    <div className="flex flex-wrap gap-4">
                        {daysOfWeek.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                            id={`day-${day}`}
                            checked={selectedDays[day] || false}
                            onCheckedChange={() => handleDayChange(day)}
                            disabled={!isSuperAdmin}
                            />
                            <Label htmlFor={`day-${day}`} className="font-normal">{day}</Label>
                        </div>
                        ))}
                    </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                        <Label htmlFor="start-time">Hora de Inicio</Label>
                        <Input
                            id="start-time"
                            type="time"
                            className="w-full"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={!isSuperAdmin}
                        />
                        </div>
                        <div className="grid gap-3">
                        <Label htmlFor="end-time">Hora de Fin</Label>
                        <Input
                            id="end-time"
                            type="time"
                            className="w-full"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            disabled={!isSuperAdmin}
                        />
                        </div>
                    </div>
                </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Estudiantes del Grupo</CardTitle>
                    <CardDescription>Lista de estudiantes inscritos en este grupo.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingStudents ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : hasStudents ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.displayName}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg">
                            <Users className="w-12 h-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                No hay estudiantes en este grupo.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      {isSuperAdmin && (
        <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" asChild>
            <Link href="/groups">Cancelar</Link>
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
      )}
    </div>
  );
}
