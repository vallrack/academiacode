
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUser } from '@/ai/create-user-flow';
import { collection, type DocumentData, type Query, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/app/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { cn } from '@/lib/utils';

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

type UserRole = 'STUDENT' | 'TEACHER' | 'SUPER_ADMIN';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [groups, setGroups] = useState<DocumentData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    if (!firestore) {
      setLoadingGroups(false);
      return;
    }

    setLoadingGroups(true);
    const groupsQuery = collection(firestore, "groups");
    
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth) {
       toast({
            variant: 'destructive',
            title: 'Error de Configuración',
            description: 'El servicio de autenticación no está disponible.',
        });
        return;
    }

    setLoading(true);

    try {
      const isAdminRegistration = email.toLowerCase() === 'vallrack67@gmail.com';
      const finalRole: UserRole = isAdminRegistration ? 'SUPER_ADMIN' : role; 
      
      if (finalRole === 'STUDENT' && !selectedGroup) {
        toast({
            variant: 'destructive',
            title: 'Campo Requerido',
            description: 'Por favor, selecciona un grupo para continuar.',
        });
        setLoading(false);
        return;
      }

      // 1. Create user document and auth custom claims via server action
      await createUser({
        email,
        password,
        displayName,
        role: finalRole,
        groupId: finalRole === 'STUDENT' ? selectedGroup : null,
      });

      // 2. Sign in the new user to get a session
      await signInWithEmailAndPassword(auth, email, password);
        
      // 3. CRITICAL: Force a token refresh to get the new custom claims
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true);
      }
      
      toast({
        title: '¡Cuenta Creada y Sesión Iniciada!',
        description: `Te has registrado correctamente como ${finalRole}. Redirigiendo...`,
      });
      
      // 4. Redirect to the dashboard
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Error durante el registro:', error);
      toast({
          variant: "destructive",
          title: "Error en el Registro",
          description: error.message || "No se pudo completar el registro. Verifica los datos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdminEmail = email.toLowerCase() === 'vallrack67@gmail.com';

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center">
        <Logo className="mb-2" />
        <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
        <CardDescription>
          Ingresa tus datos para registrarte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Nombre Completo</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Ej. Ada Lovelace"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
           <div className={cn("grid gap-2", isSuperAdminEmail && "hidden")}>
             <Label htmlFor="role">Soy un</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="role">
                      <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="STUDENT">Estudiante</SelectItem>
                      <SelectItem value="TEACHER">Profesor</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          
          <div className={cn("grid-cols-1 gap-2", role === 'STUDENT' && !isSuperAdminEmail ? "grid" : "hidden")}>
              <Label htmlFor="group">Grupo</Label>
              {loadingGroups ? (
                  <Skeleton className="h-10 w-full" />
              ) : (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger id="group" aria-label="Selecciona un grupo">
                          <SelectValue placeholder="Selecciona tu grupo y jornada" />
                      </SelectTrigger>
                      <SelectContent>
                          {groups && groups.length > 0 ? (
                              groups.map(group => (
                                  <SelectItem key={group.id} value={group.id}>
                                      {(group as Group).name} - {formatSchedule((group as Group).schedule)}
                                  </SelectItem>
                              ))
                          ) : (
                              <SelectItem value="no-groups" disabled>
                                  No hay grupos disponibles
                              </SelectItem>
                          )}
                      </SelectContent>
                  </Select>
              )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        ¿Ya tienes una cuenta?&nbsp;
        <Link href="/login" className="underline">
          Inicia sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
