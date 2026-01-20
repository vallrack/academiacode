
'use client';

import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, type DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wifi, Signal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';

const roleMap: Record<string, string> = {
  STUDENT: "Estudiante",
  TEACHER: "Profesor",
  SUPER_ADMIN: "Super Admin",
};

export function RealTimeUsers() {
  const { userProfile, loadingProfile } = useUserProfile();
  const firestore = useFirestore();
  const [onlineUsers, setOnlineUsers] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (loadingProfile || !firestore || !userProfile) {
      setIsLoading(false);
      return;
    }

    // Simplified logic: SUPER_ADMIN and TEACHER have the same permissions for this component.
    const isPrivilegedUser = userProfile.role === 'SUPER_ADMIN' || userProfile.role === 'TEACHER';

    if (!isPrivilegedUser) {
        setOnlineUsers([]);
        setIsLoading(false);
        return;
    }

    const usersCollection = collection(firestore, 'users');
    const usersQuery = query(usersCollection, where('status', '==', 'online'));
  
    setIsLoading(true);
    const unsubscribe = onSnapshot(usersQuery, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Further client-side filtering can be done here if needed in the future
        setOnlineUsers(usersData);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error en Snapshot de Usuarios en Tiempo Real:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, [firestore, userProfile, loadingProfile]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error al Cargar Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive">No se pudieron cargar los usuarios en tiempo real. Revisa las reglas de seguridad y la consola.</p>
                <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Signal className="text-green-500"/>
            Usuarios en Tiempo Real
        </CardTitle>
        <CardDescription>
          Usuarios que están actualmente activos en la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {onlineUsers && onlineUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Última Actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onlineUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} />}
                          <AvatarFallback>{user.displayName?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleMap[user.role] || 'Desconocido'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {user.lastSeen?.toDate ? 
                            formatDistanceToNow(user.lastSeen.toDate(), { addSuffix: true, locale: es }) 
                            : 'Ahora mismo'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
            <Wifi className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 font-medium">No hay usuarios activos en este momento</p>
            <p className="text-sm text-muted-foreground">Cuando alguien inicie sesión, aparecerá aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
