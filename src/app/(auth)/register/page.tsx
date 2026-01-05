
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/app/logo';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Error de configuración",
            description: "Los servicios de Firebase no están disponibles. Contacta al administrador.",
        });
        return;
    }
    setLoading(true);

    try {
      const SUPER_ADMIN_KEY = 'academia2025';
      const TEACHER_KEY = 'teacher2025';
      
      let role = 'STUDENT'; 
      
      if (adminKey === SUPER_ADMIN_KEY) {
        role = 'SUPER_ADMIN';
      } else if (adminKey === TEACHER_KEY) {
        role = 'TEACHER';
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userProfileData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email?.split('@')[0] || '',
        photoURL: user.photoURL || '',
        role: role
      };

      const userDocRef = doc(firestore, 'users', user.uid);

      // Create user profile in Firestore. This will now succeed due to updated rules.
      await setDoc(userDocRef, userProfileData);

      toast({
        title: '¡Cuenta Creada!',
        description: `Te has registrado correctamente como ${role}.`,
      });
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Error creando cuenta:', error);
       if (error.code && error.code.startsWith('auth/')) {
         toast({
          variant: 'destructive',
          title: 'Error de Autenticación',
          description: "La contraseña debe tener al menos 6 caracteres o el correo ya está en uso.",
        });
      } else {
        // This will catch Firestore permission errors if they still happen
        const permissionError = new FirestorePermissionError({
            path: `users/${auth.currentUser?.uid || 'new-user'}`,
            operation: 'create',
            requestResourceData: { email, displayName },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Error al Guardar Perfil",
            description: "No se pudo crear el perfil de usuario. Revisa las reglas de seguridad de Firestore.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
          <div className="grid gap-2">
            <Label htmlFor="adminKey">
              Clave Especial (Opcional)
              <span className="text-xs text-gray-500 ml-2">
                Para Admin o Profesor
              </span>
            </Label>
            <Input 
              id="adminKey" 
              type="password" 
              placeholder="Déjalo vacío si eres estudiante"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
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
