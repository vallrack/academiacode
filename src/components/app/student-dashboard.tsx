'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, or, type DocumentData, onSnapshot } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { AssignmentCard } from './assignment-card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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
    const [groupMates, setGroupMates] = useState<DocumentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !userProfile?.groupId || userProfile.role !== 'STUDENT') {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const groupMatesQuery = query(
            collection(firestore, 'users'),
            where('groupId', '==', userProfile.groupId)
        );

        const unsubscribe = onSnapshot(groupMatesQuery, 
            (snapshot) => {
                const matesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGroupMates(matesData);
                setError(null);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching group mates: ", err);
                setError(err);
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, [firestore, userProfile?.groupId, userProfile.role]);
    
    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (error) {
        console.error('Error loading group mates:', error);
        return null; // Don't render the card if there's an error
    }
    
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
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !userProfile?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const studentTargets = [userProfile.uid];
        if (userProfile.groupId) studentTargets.push(userProfile.groupId);
        
        const assignmentsQuery = query(
            collection(firestore, "assignments"),
            where('targetId', 'in', studentTargets)
        );

        const unsubscribe = onSnapshot(assignmentsQuery, 
            (snapshot) => {
                const assignmentsData = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as Assignment))
                    .filter(a => (a.targetType === 'student' && a.targetId === userProfile.uid) || (a.targetType === 'group' && a.targetId === userProfile.groupId));
                
                setAssignments(assignmentsData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching assignments for student:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [firestore, userProfile?.uid, userProfile?.groupId]);


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
