
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, type DocumentData, type Query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dices } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';


export function StudentDashboard({ userProfile }: { userProfile: DocumentData }) {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAssigning, setIsAssigning] = useState(false);

    const challengesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query for challenges that are published
        return query(collection(firestore, "challenges"), where("status", "==", "published"));
    }, [firestore]);

    const { data: publishedChallenges, loading } = useCollection(challengesQuery);

    const handleStartRandomChallenge = () => {
        if (!publishedChallenges || publishedChallenges.length === 0) {
            toast({
                variant: "destructive",
                title: "No hay desafíos disponibles",
                description: "No hay desafíos publicados en este momento. Vuelve a intentarlo más tarde.",
            });
            return;
        }

        setIsAssigning(true);
        // Select a random challenge
        const randomIndex = Math.floor(Math.random() * publishedChallenges.length);
        const randomChallenge = publishedChallenges[randomIndex];
        
        toast({
            title: "¡Desafío Asignado!",
            description: `¡Mucha suerte con "${randomChallenge.title}"!`,
        });

        // Redirect to the session page for that challenge
        router.push(`/session/${randomChallenge.id}`);
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>¡Bienvenido de nuevo, {userProfile.displayName}!</CardTitle>
                    <CardDescription>¿Listo para un nuevo desafío? Presiona el botón para comenzar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                        <div className="flex flex-col items-center gap-4 text-center">
                            {loading ? (
                                <>
                                    <Skeleton className="h-10 w-64" />
                                    <Skeleton className="h-6 w-48" />
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold tracking-tight">
                                      ¿Listo para poner a prueba tus habilidades?
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      Se te asignará un desafío al azar de nuestra biblioteca.
                                    </p>
                                    <Button 
                                        className="mt-4" 
                                        size="lg" 
                                        onClick={handleStartRandomChallenge} 
                                        disabled={isAssigning || loading || !publishedChallenges || publishedChallenges.length === 0}
                                    >
                                        <Dices className="mr-2 h-5 w-5" />
                                        {isAssigning ? "Asignando..." : "Comenzar Desafío Aleatorio"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

