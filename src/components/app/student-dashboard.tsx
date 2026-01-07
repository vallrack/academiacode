'use client';

import { useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, or, type DocumentData, type Query, type WhereFilterOp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { AssignmentCard } from './assignment-card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Assignment = {
    id: string;
    challengeId: string;
    targetId: string;
    targetType: 'student' | 'group';
    dueDate: any;
};

// New component to display group mates
function GroupMatesComponent({ userProfile }: { userProfile: DocumentData }) {
    const firestore = useFirestore();

    const groupMatesQuery = useMemoFirebase(() => {
        // Solo ejecutar la query si el usuario es estudiante y tiene un groupId
        if (!firestore || !userProfile?.groupId || userProfile.role !== 'STUDENT') return null;
        
        return query(
            collection(firestore, 'users'),
            where('groupId', '==', userProfile.groupId)
        );
    }, [firestore, userProfile?.groupId, userProfile?.role]);

    const { data: groupMates, isLoading, error } = useCollection<DocumentData>(groupMatesQuery);
    
    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (error) {
        console.error('Error loading group mates:', error);
        return null; // Don't render the card if there's an error
    }
    
    // Filter out the current user from the list
    const otherMates = groupMates?.filter(mate => mate.id !== userProfile.uid);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Compañeros de Grupo</CardTitle>
                <CardDescription>Estos son los miembros de tu grupo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {otherMates && otherMates.length > 0 ? (
                    otherMates.map(mate => (
                        <div key={mate.id} className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                                {mate.photoURL && <AvatarImage src={mate.photoURL} alt={mate.displayName} />}
                                <AvatarFallback>{mate.displayName?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{mate.displayName}</p>
                                <p className="text-sm text-muted-foreground">{mate.email}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">Parece que eres el único en este grupo por ahora.</p>
                )}
            </CardContent>
        </Card>
    );
}


export function StudentDashboard({ userProfile }: { userProfile: DocumentData }) {
    const firestore = useFirestore();

    const assignmentsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.uid) return null;
        
        const conditions = [];
        if (userProfile.groupId) {
            conditions.push(where('targetId', '==', userProfile.groupId), where('targetType', '==', 'group'));
        }
        conditions.push(where('targetId', '==', userProfile.uid), where('targetType', '==', 'student'));


        return query(
            collection(firestore, "assignments"),
            or(
                where('targetId', '==', userProfile.uid),
                where('targetId', '==', userProfile.groupId || '______') // use a non-existent id if no groupId
            )
        ) as Query<Assignment & DocumentData>;

    }, [firestore, userProfile?.uid, userProfile?.groupId]);

    const { data: assignments, loading } = useCollection(assignmentsQuery);

    const hasAssignments = !loading && assignments && assignments.length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>¡Bienvenido de nuevo, {userProfile.displayName}!</CardTitle>
                        <CardDescription>Aquí están los desafíos que tienes pendientes. ¡Mucha suerte!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Skeleton className="h-48 w-full" />
                                <Skeleton className="h-48 w-full" />
                            </div>
                        ) : hasAssignments ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {assignments.map((assignment) => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <h3 className="text-2xl font-bold tracking-tight">
                                    No tienes desafíos asignados
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                    Cuando un profesor te asigne un desafío, aparecerá aquí.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
                 {userProfile.groupId && userProfile.role === 'STUDENT' && (
                    <GroupMatesComponent userProfile={userProfile} />
                )}
            </div>
        </div>
    );
}
