
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase/provider';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

type ChallengeDifficulty = 'Básico' | 'Medio' | 'Avanzado';
const difficulties: ChallengeDifficulty[] = ['Básico', 'Medio', 'Avanzado'];

export default function EditChallengePage() {
    const { id } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const user = useUser();
    const { toast } = useToast();

    // State for all form fields
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [category, setCategory] = useState('');
    const [difficulty, setDifficulty] = useState<ChallengeDifficulty>('Básico');
    const [description, setDescription] = useState('');
    const [testCases, setTestCases] = useState('');
    const [allowInteractive, setAllowInteractive] = useState(false);
    const [maxAttempts, setMaxAttempts] = useState<number | ''>(3);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch challenge data on component mount
    useEffect(() => {
        if (!firestore || !id) return;
        
        const challengeRef = doc(firestore, 'challenges', id as string);
        getDoc(challengeRef)
            .then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title || '');
                    setLanguage(data.language || 'javascript');
                    setCategory(data.category || '');
                    setDifficulty(data.difficulty || 'Básico');
                    setDescription(data.description || '');
                    setTestCases(data.testCases || '');
                    setAllowInteractive(data.allowInteractiveApis || false);
                    setMaxAttempts(data.maxAttempts === null ? '' : data.maxAttempts || 3);
                } else {
                    setError('No se encontró el desafío.');
                    toast({ variant: 'destructive', title: 'Error', description: 'No se encontró el desafío.' });
                }
            })
            .catch(() => {
                setError('Error al cargar el desafío.');
                toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un problema al cargar el desafío.' });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [firestore, id, toast]);

    // Handle form submission
    const handleUpdate = async () => {
        if (!title || !description || !language || !category) {
            toast({
                variant: 'destructive',
                title: 'Error de Validación',
                description: 'Por favor, completa todos los campos obligatorios.',
            });
            return;
        }

        if (!user || !firestore || !id) {
            toast({
                variant: 'destructive',
                title: 'Error de Autenticación',
                description: 'Debes iniciar sesión para editar un desafío.',
            });
            return;
        }

        try {
            JSON.parse(testCases);
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Error en los Casos de Prueba',
                description: 'El formato de los casos de prueba no es un JSON válido.',
            });
            return;
        }

        setIsSaving(true);

        const challengeRef = doc(firestore, 'challenges', id as string);
        const challengeData = {
            title,
            description,
            language,
            category,
            difficulty,
            testCases,
            allowInteractiveApis: allowInteractive,
            maxAttempts: maxAttempts === '' ? null : Number(maxAttempts),
            updatedAt: serverTimestamp(),
        };

        try {
            await updateDoc(challengeRef, challengeData);
            toast({
                title: '¡Desafío Actualizado!',
                description: `El desafío "${title}" ha sido actualizado correctamente.`,
            });
            router.push('/admin/challenges'); // Redirect after successful update
        } catch (serverError) {
            console.error('Error updating challenge: ', serverError);
            toast({
                variant: 'destructive',
                title: 'Error al Actualizar',
                description: 'No se pudo actualizar el desafío. Inténtalo de nuevo.',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="p-6">Cargando desafío...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/challenges">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Editar Desafío
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/challenges">Cancelar</Link>
                    </Button>
                    <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Desafío</CardTitle>
                    <CardDescription>
                        Modifica el formulario para editar el desafío de código.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        {/* Title and Language */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="title">Título</Label>
                                <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="language">Lenguaje</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="html">HTML</SelectItem>
                                        <SelectItem value="javascript">JavaScript</SelectItem>
                                        <SelectItem value="python">Python</SelectItem>
                                        {/* Add other languages as needed */}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Category, Difficulty, Max Attempts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="category">Categoría</Label>
                                <Input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="difficulty">Dificultad</Label>
                                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ChallengeDifficulty)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="max-attempts">Máximo de Intentos</Label>
                                <Input id="max-attempts" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value === '' ? '' : Number(e.target.value))} />
                            </div>
                        </div>
                        {/* Description */}
                        <div className="grid gap-3">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32" />
                        </div>
                        {/* Test Cases */}
                        <div className="grid gap-3">
                            <Label htmlFor="test-cases">Casos de Prueba (JSON)</Label>
                            <Textarea id="test-cases" value={testCases} onChange={(e) => setTestCases(e.target.value)} className="min-h-32 font-mono" />
                        </div>
                        {/* Interactive APIs Switch */}
                        <div className="flex items-center space-x-2">
                            <Switch id="interactive-mode" checked={allowInteractive} onCheckedChange={setAllowInteractive} />
                            <Label htmlFor="interactive-mode">Permitir APIs interactivas (ej. prompt, alert)</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex items-center justify-center gap-2 md:hidden">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/challenges">Cancelar</Link>
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
}
