
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, collection, DocumentData, Query } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { Checkbox } from '@/components/ui/checkbox';

type UserRole = "STUDENT" | "TEACHER" | "SUPER_ADMIN";

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

export default function EditUserPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [studentGroupId, setStudentGroupId] = useState('');
  const [teacherManagedGroups, setTeacherManagedGroups] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const { id: userId } = params;
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: currentUser } = useUser(); // The logged-in admin
  const isSuperAdmin = currentUser?.uid && true; // Simple check if user is logged in

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return collection(firestore, "groups") as Query<Group & DocumentData>;
  }, [firestore, currentUser]);

  const { data: allGroups, loading: loadingGroups } = useCollection(groupsQuery);

  useEffect(() => {
    if (!firestore || !userId) return;

    const fetchUser = async () => {
      setLoading(true);
      const userDocRef = doc(firestore, 'users', Array.isArray(userId) ? userId[0] : userId);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setDisplayName(userData.displayName || '');
          setEmail(userData.email || '');
          setRole(userData.role || 'STUDENT');
          
          if (userData.role === 'STUDENT') {
            setStudentGroupId(userData.groupId || '');
          }
          
          if (userData.role === 'TEACHER') {
            const managedIds: string[] = userData.managedGroupIds || [];
            const managedMap = managedIds.reduce((acc: Record<string, boolean>, id: string) => {
              acc[id] = true;
              return acc;
            }, {});
            setTeacherManagedGroups(managedMap);
          }
          
        } else {
          toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar al usuario." });
          router.push('/users');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({ variant: "destructive", title: "Error al cargar", description: "No se pudieron cargar los datos del usuario." });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [firestore, userId, toast, router]);

  const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') return schedule;
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
  };
  
  const handleTeacherGroupChange = (groupId: string) => {
    setTeacherManagedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleUpdate = async () => {
    if (!firestore || !userId || !isSuperAdmin) return;

    if (!displayName || !email || !role) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Por favor, completa todos los campos requeridos." });
      return;
    }
    
    if (role === 'STUDENT' && !studentGroupId) {
        toast({ variant: "destructive", title: "Campo Requerido", description: "Un estudiante debe pertenecer a un grupo." });
        return;
    }

    setIsSaving(true);
    const userDocRef = doc(firestore, 'users', Array.isArray(userId) ? userId[0] : userId);

    try {
      const updatedData: any = { displayName, email, role };
      
      if (role === 'STUDENT') {
        updatedData.groupId = studentGroupId;
        updatedData.managedGroupIds = null; // Clear teacher groups
      } else if (role === 'TEACHER') {
        updatedData.groupId = null; // Clear student group
        updatedData.managedGroupIds = Object.keys(teacherManagedGroups).filter(id => teacherManagedGroups[id]);
      } else { // Super Admin
        updatedData.groupId = null;
        updatedData.managedGroupIds = null;
      }
      
      await updateDoc(userDocRef, updatedData);
      toast({ title: "¡Usuario Actualizado!", description: `Los datos de ${displayName} se han actualizado correctamente.` });
      router.push(role === 'STUDENT' ? '/students' : '/users');
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ variant: "destructive", title: "Error al Actualizar", description: "No se pudo actualizar el usuario. Verifica los permisos." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4"><Skeleton className="h-7 w-7 rounded-full" /><Skeleton className="h-6 w-40" /></div>
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-3"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="grid gap-3"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                     <div className="grid gap-3"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/users">
            <ChevronLeft className="h-4 w-4" /><span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">Modificar Usuario</h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild><Link href="/users">Cancelar</Link></Button>
          <Button size="sm" onClick={handleUpdate} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Cambios"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detalles del Usuario</CardTitle><CardDescription>Modifica los datos y permisos del usuario.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3"><Label htmlFor="displayName">Nombre Completo</Label><Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div className="grid gap-3"><Label htmlFor="email">Correo Electrónico</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="grid gap-3">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Estudiante</SelectItem>
                  <SelectItem value="TEACHER">Profesor</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'STUDENT' && (
              <div className="grid gap-3">
                <Label htmlFor="group">Grupo del Estudiante</Label>
                {loadingGroups ? <Skeleton className="h-10 w-full" /> : (
                    <Select value={studentGroupId} onValueChange={setStudentGroupId}>
                        <SelectTrigger id="group"><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                        <SelectContent>{allGroups && allGroups.length > 0 ? allGroups.map(group => (<SelectItem key={group.id} value={group.id}>{group.name} - {formatSchedule(group.schedule)}</SelectItem>)) : (<SelectItem value="no-groups" disabled>No hay grupos disponibles</SelectItem>)}</SelectContent>
                    </Select>
                )}
              </div>
            )}

            {role === 'TEACHER' && (
              <div className="grid gap-3">
                <Label>Grupos que Gestiona el Profesor</Label>
                <Card className="p-4"><div className="space-y-3">
                  {loadingGroups ? <Skeleton className="h-16 w-full" /> : allGroups && allGroups.length > 0 ? allGroups.map(group => (
                    <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox id={`group-${group.id}`} checked={teacherManagedGroups[group.id] || false} onCheckedChange={() => handleTeacherGroupChange(group.id)} />
                        <Label htmlFor={`group-${group.id}`} className="font-normal w-full">{group.name} - <span className="text-muted-foreground text-xs">{formatSchedule(group.schedule)}</span></Label>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No hay grupos para asignar.</p>
                  )}
                </div></Card>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-center gap-2 md:hidden">
        <Button variant="outline" size="sm" asChild><Link href="/users">Cancelar</Link></Button>
        <Button size="sm" onClick={handleUpdate} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Cambios"}</Button>
      </div>
    </div>
  );
}
