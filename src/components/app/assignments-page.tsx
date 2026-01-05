'use client';

import React, { useState } from 'react';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy, or, type DocumentData, type Query } from "firebase/firestore";
import { Calendar, BookOpen, Users, Clock, User, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import CreateAssignmentForm from '@/components/app/create-assignment-form';

interface AssignmentsPageProps {
  userProfile?: DocumentData;
  loadingProfile?: boolean;
}

export default function AssignmentsPage({ userProfile, loadingProfile }: AssignmentsPageProps) {
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  if (loadingProfile || !userProfile) {
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

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || loadingProfile) return null;

    const assignmentsRef = collection(firestore, 'assignments');

    if (userProfile.role === 'TEACHER' || userProfile.role === 'SUPER_ADMIN') {
      return query(assignmentsRef, orderBy('assignedAt', 'desc'));
    }

    const studentClauses = [where('targetId', '==', userProfile.uid)];
    if(userProfile.groupId) {
        studentClauses.push(where('targetId', '==', userProfile.groupId))
    }
    return query(assignmentsRef, or(...studentClauses), orderBy('assignedAt', 'desc'));


  }, [firestore, userProfile?.uid, userProfile?.role, userProfile?.groupId, loadingProfile]);

  const { data: assignments, isLoading, error } = useCollection<DocumentData>(assignmentsQuery);

  const formatDate = (timestamp: any) => {
    let date: Date;
    if (timestamp?.toDate) { date = timestamp.toDate(); }
    else if (typeof timestamp === 'string') { date = new Date(timestamp); }
    else { return 'Fecha no disponible'; }
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    let date: Date;
    if (dueDate?.toDate) { date = dueDate.toDate(); }
    else if (typeof dueDate === 'string') { date = new Date(dueDate); }
    else { return false; }
    return date < new Date();
  };

  const canCreate = userProfile.role === 'TEACHER' || userProfile.role === 'SUPER_ADMIN';

  if (isLoading) {
     return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-1/3" />
            {canCreate && <Skeleton className="h-10 w-40" />}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="grid gap-2">
            <h1 className="text-2xl font-bold">
            {userProfile.role === 'STUDENT' ? 'Mis Asignaciones' : 'Gestión de Asignaciones'}
            </h1>
            <p className="text-muted-foreground">
            {userProfile.role === 'STUDENT' 
                ? 'Completa tus desafíos antes de la fecha límite.'
                : 'Gestiona las asignaciones de tus estudiantes.'
            }
            </p>
        </div>
        {canCreate && (
            <Button className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Nueva Asignación
            </Button>
        )}
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16 mt-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    No hay asignaciones para mostrar
                </h3>
                <p className="text-sm text-muted-foreground">
                    {canCreate ? 'Crea una nueva asignación para verla aquí.' : 'Cuando un profesor te asigne un desafío, aparecerá aquí.'}
                </p>
                {canCreate && <Button className="mt-4" onClick={() => setIsFormOpen(true)}>Nueva Asignación</Button>}
            </div>
        </div>
      ) : (
        <div className="grid gap-6">
            {assignments.map((assignment) => {
            const overdue = assignment.dueDate && isOverdue(assignment.dueDate);
            
            return (
                <div
                key={assignment.id}
                className={`bg-card rounded-lg border p-6 transition-shadow hover:shadow-md ${
                    overdue ? 'border-destructive' : 'border-border'
                }`}
                >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        {assignment.targetType === 'group' ? (
                        <div className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            <Users className="w-4 h-4" />
                            <span>Asignación Grupal</span>
                        </div>
                        ) : (
                        <div className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                            <User className="w-4 h-4" />
                            <span>Asignación Individual</span>
                        </div>
                        )}
                    </div>

                    <h3 className="text-xl font-semibold mb-3">
                        Desafío Asignado (ID: ...{assignment.challengeId.slice(-6)})
                    </h3>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-3">
                        {assignment.dueDate && (
                        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            <Calendar className="w-4 h-4" />
                            <span>
                            Entrega: {formatDate(assignment.dueDate)}
                            {overdue && <span className="ml-1">(Vencida)</span>}
                            </span>
                        </div>
                        )}
                        
                        {assignment.assignedAt && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Asignada: {formatDate(assignment.assignedAt)}</span>
                        </div>
                        )}
                    </div>
                    </div>

                    <Button
                    onClick={() => router.push(`/session/${assignment.challengeId}`)}
                    variant={overdue ? 'destructive' : 'default'}
                    className="w-full mt-4 sm:w-auto sm:mt-0"
                    >
                    {userProfile.role === 'STUDENT' ? 'Comenzar Desafío' : 'Ver Detalles'}
                    </Button>
                </div>
                </div>
            );
            })}
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
