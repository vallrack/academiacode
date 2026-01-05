
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy, or, type DocumentData, type Query } from "firebase/firestore";
import { Calendar, BookOpen, Users, Clock, User, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import CreateAssignmentForm from '@/components/app/create-assignment-form';

interface AssignmentsPageProps {
  userProfile: DocumentData;
  loadingProfile: boolean;
}

const AssignmentCard = ({ assignment, userRole }: { assignment: DocumentData, userRole: string }) => {
    const router = useRouter();
    const firestore = useFirestore();

    const { data: challenge, isLoading: loadingChallenge } = useDoc<DocumentData>(useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'challenges', assignment.challengeId);
    }, [firestore, assignment.challengeId]));

    const { data: target, isLoading: loadingTarget } = useDoc<DocumentData>(useMemoFirebase(() => {
        if (!firestore) return null;
        const collectionName = assignment.targetType === 'group' ? 'groups' : 'users';
        return doc(firestore, collectionName, assignment.targetId);
    }, [firestore, assignment.targetId, assignment.targetType]));

    const isLoading = loadingChallenge || loadingTarget;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Fecha no disponible';
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const isOverdue = assignment.dueDate && assignment.dueDate.toDate() < new Date();

    if (isLoading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
        );
    }
    
    if (!challenge) return null;

    return (
        <Card className={`flex flex-col ${isOverdue ? 'border-red-300' : ''}`}>
            <CardHeader>
                <CardTitle>{challenge.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                     <Badge variant={assignment.targetType === 'group' ? 'default' : 'secondary'} className="flex items-center gap-1.5">
                        {assignment.targetType === 'group' ? <Users className="h-3 w-3"/> : <User className="h-3 w-3"/>}
                        {target ? target.name || target.displayName : (assignment.targetType === 'group' ? 'Grupo' : 'Estudiante')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Entrega: {formatDate(assignment.dueDate)} {isOverdue && '(Vencida)'}</span>
                </div>
                <Button 
                    className="w-full"
                    onClick={() => router.push(`/session/${assignment.challengeId}`)}
                    variant={isOverdue ? 'destructive' : 'default'}
                >
                    {userRole === 'STUDENT' ? 'Comenzar Desafío' : 'Ver Detalles'}
                </Button>
            </CardFooter>
        </Card>
    );
};


// Main Page Component
export default function AssignmentsPage({ userProfile, loadingProfile }: AssignmentsPageProps) {
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.uid) return null;

    const assignmentsRef = collection(firestore, 'assignments');

    if (userProfile.role === 'TEACHER' || userProfile.role === 'SUPER_ADMIN') {
      return query(assignmentsRef, orderBy('assignedAt', 'desc'));
    }

    if (userProfile.role === 'STUDENT') {
        const studentClauses = [where('targetId', '==', userProfile.uid)];
        if(userProfile.groupId) {
            studentClauses.push(where('targetId', '==', userProfile.groupId))
        }
       return query(assignmentsRef, or(...studentClauses));
    }

    return null;
  }, [firestore, userProfile?.uid, userProfile?.role, userProfile?.groupId]);

  const { data: assignments, isLoading, error } = useCollection<DocumentData>(assignmentsQuery);

  if (loadingProfile || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive">
          <AlertTitle>Error al cargar asignaciones</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
    );
  }
  
  const canCreate = userProfile.role === 'TEACHER' || userProfile.role === 'SUPER_ADMIN';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">
            {canCreate ? 'Gestión de Asignaciones' : 'Mis Asignaciones'}
        </h1>
        {canCreate && (
            <Button className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Nueva Asignación
            </Button>
        )}
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Re-import useDoc inside the map or pass it down if needed */}
            {assignments.map((assignment) => {
                // This is a simplified example; for performance, you'd want to fetch docs efficiently
                // For now, we'll re-import a hook that can fetch a doc by ID.
                const { doc } = require('firebase/firestore');
                const { useDoc } = require('@/firebase/firestore/use-doc');
                return <AssignmentCard key={assignment.id} assignment={assignment} userRole={userProfile.role} />
            })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16 mt-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    No hay asignaciones para mostrar
                </h3>
                <p className="text-sm text-muted-foreground">
                    {canCreate ? 'Crea una nueva asignación para tus estudiantes.' : 'Cuando un profesor te asigne un desafío, aparecerá aquí.'}
                </p>
                {canCreate && <Button className="mt-4" onClick={() => setIsFormOpen(true)}>Nueva Asignación</Button>}
            </div>
        </div>
      )}

      {isFormOpen && canCreate && (
        <CreateAssignmentForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
