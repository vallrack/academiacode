
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase/provider';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { ChallengeForm, challengeFormSchema } from '@/components/app/challenge-form';

export default function EditChallengePage() {
    const { id } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const user = useUser();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof challengeFormSchema>>({
        resolver: zodResolver(challengeFormSchema),
        defaultValues: {
            title: '',
            description: '',
            difficulty: 'easy',
            points: 10,
            initialCode: '',
            testCases: [{ input: '', expectedOutput: '' }],
            solution: '',
            modelUrl: '',
        },
    });

    useEffect(() => {
        if (!firestore || !id) return;
        const challengeRef = doc(firestore, 'challenges', id as string);
        getDoc(challengeRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                form.reset(data); 
            } else {
                setError('No se encontró el desafío.');
            }
        }).catch(() => {
            setError('Error al cargar el desafío.');
        }).finally(() => {
            setIsLoading(false);
        });
    }, [firestore, id, form]);

    const onSubmit = async (values: z.infer<typeof challengeFormSchema>) => {
        if (!firestore || !id || !user) return;
        const challengeRef = doc(firestore, 'challenges', id as string);
        try {
            await updateDoc(challengeRef, {
                ...values,
                updatedAt: new Date(),
            });
            router.push('/admin/challenges');
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    if (isLoading) return <p>Cargando desafío...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Editar Desafío</h1>
            <ChallengeForm form={form} onSubmit={onSubmit} />
        </div>
    );
}
