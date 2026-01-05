'use client';

import { useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, type DocumentData } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Clock, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Assignment = {
    id: string;
    challengeId: string;
    targetId: string;
    targetType: 'student' | 'group';
    dueDate: { seconds: number; nanoseconds: number; } | Date; // Firestore timestamp or Date object
};

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
    const router = useRouter();
    const firestore = useFirestore();

    const challengeRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'challenges', assignment.challengeId);
    }, [firestore, assignment.challengeId]);
    const { data: challenge, isLoading: loadingChallenge } = useDoc<DocumentData>(challengeRef);

    const groupRef = useMemoFirebase(() => {
        if (!firestore || assignment.targetType !== 'group') return null;
        return doc(firestore, 'groups', assignment.targetId);
    }, [firestore, assignment.targetId, assignment.targetType]);
    const { data: group, isLoading: loadingGroup } = useDoc<DocumentData>(groupRef);
    
    const isLoading = loadingChallenge || loadingGroup;

    const handleStart = () => {
        router.push(`/session/${assignment.challengeId}`);
    };

    const formatDate = (date: { seconds: number; nanoseconds: number; } | Date) => {
        if (date instanceof Date) {
            return format(date, "PPP", { locale: es });
        }
        if (date && date.seconds) {
            return format(new Date(date.seconds * 1000), "PPP", { locale: es });
        }
        return "Sin fecha límite";
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="flex-grow">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        );
    }
    
    if (!challenge) {
        return (
             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error en la Asignación</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">No se pudo cargar el desafío asociado. Puede que haya sido eliminado.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{challenge.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    {assignment.targetType === 'group' ? 
                        <Badge variant="outline" className="flex items-center gap-1.5"><Users className="h-3 w-3"/>{group ? group.name : 'Grupo'}</Badge> 
                        : 
                        <Badge variant="secondary" className="flex items-center gap-1.5"><User className="h-3 w-3"/>Individual</Badge>
                    }
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{challenge.description}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Entrega: {formatDate(assignment.dueDate)}</span>
                </div>
                <Button className="w-full" onClick={handleStart}>Comenzar Desafío</Button>
            </CardFooter>
        </Card>
    );
}
