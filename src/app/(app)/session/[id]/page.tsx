'use client';

import React, { use } from 'react';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";
import { useUserProfile } from '@/contexts/user-profile-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';


interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  // Unwrap params using React.use()
  const { id: challengeId } = use(params);
  
  const { userProfile, loadingProfile } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();


  const challengeRef = useMemoFirebase(() => {
    if (!firestore || !challengeId) return null;
    return doc(firestore, 'challenges', challengeId);
  }, [firestore, challengeId]);

  const { data: challenge, isLoading: isLoadingChallenge } = useDoc<DocumentData>(challengeRef);

  const isLoading = loadingProfile || isLoadingChallenge;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error de Perfil de Usuario</AlertTitle>
        <AlertDescription>No se pudo cargar el perfil del usuario. Por favor, recarga la página.</AlertDescription>
      </Alert>
    );
  }

  if (!challenge) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Desafío no encontrado</AlertTitle>
        <AlertDescription>No se pudo encontrar el desafío solicitado.</AlertDescription>
      </Alert>
    );
  }
  
  const handleStartSession = () => {
    router.push(`/session/ide/${challengeId}`);
  };


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sesión de Desafío</h1>
        <p className="text-muted-foreground mt-2">
          {userProfile.role === 'STUDENT' 
            ? 'Completa este desafío para mejorar tus habilidades' 
            : 'Revisa los detalles de este desafío'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{challenge.title || 'Desafío'}</CardTitle>
              <CardDescription className="mt-2">{challenge.description || 'Sin descripción'}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              ID: {challengeId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenge.difficulty && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dificultad:</span>
              <Badge variant={
                challenge.difficulty === 'easy' ? 'default' : 
                challenge.difficulty === 'medium' ? 'secondary' : 
                'destructive'
              }>
                {challenge.difficulty === 'easy' ? 'Fácil' : 
                 challenge.difficulty === 'medium' ? 'Medio' : 
                 'Difícil'}
              </Badge>
            </div>
          )}

          {challenge.topics && challenge.topics.length > 0 && (
            <div>
              <span className="text-sm font-medium block mb-2">Temas:</span>
              <div className="flex flex-wrap gap-2">
                {challenge.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="outline">{topic}</Badge>
                ))}
              </div>
            </div>
          )}

          {challenge.createdAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Creado: {challenge.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
       <div className="flex justify-end">
            <Button onClick={handleStartSession}>
                Comenzar Sesión de Práctica
            </Button>
        </div>
    </div>
  );
}
