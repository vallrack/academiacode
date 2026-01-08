'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, DocumentData, Query, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { createUser } from '@/ai/create-user-flow';

export const dynamic = 'force-dynamic';

type UserRole = "STUDENT" | "TEACHER" | "SUPER_ADMIN";

// Define the input type locally instead of importing from server file
type CreateUserInput = {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  groupId: string | null;
};

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


export default function NewUserPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const [groups, setGroups] = useState<DocumentData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    setLoadingGroups(true);
    const groupsQuery = collection(firestore, "groups") as Query<Group & DocumentData>;
    
    const unsubscribe = onSnapshot(groupsQuery, 
        (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGroups(groupsData);
            setLoadingGroups(false);
        },
        (error) => {
            console.error("Error fetching groups: ", error);
            toast({
                variant: "destructive",
                title: "Error al Cargar Grupos",
                description: "No se pudieron cargar los grupos para la selección.",
            });
            setLoadingGroups(false);
        }
    );

    return () => unsubscribe();
  }, [firestore, toast]);


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

  const handleSave = async () => {
    if (!displayName || !email || !password || !role) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, completa todos los campos requeridos.",
      });
      return;
    }
    
    if (role === 'STUDENT' && !selectedGroup) {
        toast({
            variant: "destructive",
            title: "Campo Requerido",
            description: "Un estudiante debe pertenecer a un grupo.",
        });
        return;
    }

    setIsSaving(true);

    const userInput: CreateUserInput = {
      email,
      password,
      displayName,
      role,
      groupId: role === 'STUDENT' ? selectedGroup : null,
    };

    try {
      // Call the server action
      await createUser(userInput);

      toast({
        title: "¡Usuario Creado!",
        description: `El usuario ${displayName} ha sido creado con el rol de ${role}.`,
      });
      router.push('/users');

    } catch (error: any) {
      console.error("Error creating user via server action:", error);
      toast({
        variant: "destructive",
        title: "Error al Crear Usuario",
        description: error.message || "No se pudo crear la cuenta de usuario. Revisa la consola para más detalles.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/users">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Añadir Nuevo Usuario
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/users">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Usuario"}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Nuevo Usuario</CardTitle>
          <CardDescription>
            Completa el formulario para crear una nueva cuenta y perfil de usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="displayName">Nombre Completo</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Alan Turing"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Estudiante</SelectItem>
                  <SelectItem value="TEACHER">Profesor</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'STUDENT' && (
              <div className="grid gap-3">
                <Label htmlFor="group">Grupo</Label>
                {loadingGroups ? (
                    <Skeleton className="h-10 w-full" />
                ) : (
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger id="group">
                            <SelectValue placeholder="Selecciona un grupo para el estudiante" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups && groups.length > 0 ? (
                                groups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name} - {formatSchedule(group.schedule)}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-groups" disabled>
                                    No hay grupos disponibles. Crea uno primero.
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-center gap-2 md:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href="/users">Cancelar</Link>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Usuario"}
        </Button>
      </div>
    </div>
  );
}
