'use client';

import { useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, or, type DocumentData, type Query, type WhereFilterOp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { AssignmentCard } from './assignment-card';

type Assignment = {
    id: string;
    challengeId: string;
    targetId: string;
    targetType: 'student' | 'group';
    dueDate: any;
};

export function StudentDashboard({ userProfile }: { userProfile: DocumentData }) {
    const firestore = useFirestore();

    const assignmentsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.uid) return null;
        
        // Build the conditions for the 'or' query
        const conditions: [string, WhereFilterOp, any][] = [
            ['targetId', '==', userProfile.uid]
        ];

        // Only add the group condition if a groupId exists on the profile
        if (userProfile.groupId) {
            conditions.push(['targetId', '==', userProfile.groupId]);
        }

        return query(
            collection(firestore, "assignments"),
            or(...conditions.map(([field, op, value]) => where(field, op, value)))
        ) as Query<Assignment & DocumentData>;

    }, [firestore, userProfile]);

    const { data: assignments, loading } = useCollection(assignmentsQuery);

    const hasAssignments = !loading && assignments && assignments.length > 0;

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>¡Bienvenido de nuevo, {userProfile.displayName}!</CardTitle>
                    <CardDescription>Aquí están los desafíos que tienes pendientes. ¡Mucha suerte!</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : hasAssignments ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    );
}
