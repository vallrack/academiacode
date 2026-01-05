
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/app/logo';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
      // Check if any user exists to determine role
      const usersCollection = collection(firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const isFirstUser = userSnapshot.empty;
      const role = isFirstUser ? 'ADMIN' : 'STUDENT';
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email?.split('@')[0] || '',
        photoURL: user.photoURL || '',
        role: role
      });

      toast({
        title: '¡Cuenta Creada!',
        description: 'Te has registrado correctamente. Serás redirigido.',
      });
      
      // Redirect after a short delay to allow the toast to be seen
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Error creando cuenta:', error);
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: error.message || 'No se pudo crear la cuenta.',
      });
      setLoading(false); // Make sure loading is stopped on error
    } 
    // We don't set loading to false in the `finally` block anymore,
    // because we want the button to stay disabled until redirection happens.
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
