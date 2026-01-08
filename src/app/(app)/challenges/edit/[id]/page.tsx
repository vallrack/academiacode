
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/firebase/auth/use-user';
import AssignChallengeModal from '@/components/app/assign-challenge-modal';

export const dynamic = 'force-dynamic';

export default function EditChallengePage() {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState('');
  const [allowInteractive, setAllowInteractive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { id: challengeId } = params;
  const challengeIdStr = Array.isArray(challengeId) ? challengeId[0] : challengeId;

  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    if (!firestore || !challengeIdStr) return;

    const fetchChallenge = async () => {
      setLoading(true);
      const challengeDocRef = doc(firestore, 'challenges', challengeIdStr);
      try {
        const challengeDocSnap = await getDoc(challengeDocRef);
        if (challengeDocSnap.exists()) {
          const data = challengeDocSnap.data();
          setTitle(data.title || '');
          setLanguage(data.language || '');
          setCategory(data.category || '');
          setDescription(data.description || '');
          setTestCases(data.testCases || '');
          setAllowInteractive(data.allowInteractiveApis || false);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el desafío.' });
          router.push('/challenges');
        }
      } catch (error) {
        console.error('Error fetching challenge:', error);
        toast({ variant: 'destructive', title: 'Error al Cargar', description: 'No se pudieron cargar los datos del desafío.' });
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [firestore, challengeIdStr, toast, router]);

  const handleUpdate = async () => {
    if (!firestore || !challengeIdStr || !user) return;

    if (!title || !description || !language || !category) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: 'Completa todos los campos.' });
      return;
    }

    setIsSaving(true);
    const challengeDocRef = doc(firestore, 'challenges', challengeIdStr);

    try {
      await updateDoc(challengeDocRef, {
        title,
        description,
        language,
        category,
        testCases,
        allowInteractiveApis: allowInteractive,
      });
      toast({ title: '¡Desafío Actualizado!', description: `El desafío "${title}" ha sido actualizado.` });
      // No redirigir para poder seguir asignando
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({ variant: 'destructive', title: 'Error al Actualizar', description: 'No se pudo actualizar el desafío.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/challenges">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Modificar Desafío
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
             <Button variant="outline" size="sm" asChild>
              <Link href="/challenges">Cancelar</Link>
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
             <Button size="sm" onClick={() => setIsAssignModalOpen(true)} className="gap-1.5">
                <Send className="h-4 w-4" />
                Asignar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Desafío</CardTitle>
            <CardDescription>Modifica el contenido y la configuración del desafío.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="language">Lenguaje</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                      <SelectItem value="swift">Swift</SelectItem>
                      <SelectItem value="kotlin">Kotlin</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="ruby">Ruby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ej. Semana 1"/>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32"/>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="test-cases">Casos de Prueba (JSON)</Label>
              <Textarea id="test-cases" value={testCases} onChange={(e) => setTestCases(e.target.value)} className="min-h-32 font-mono"/>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="interactive-mode" checked={allowInteractive} onCheckedChange={setAllowInteractive} />
                <Label htmlFor="interactive-mode">Permitir APIs interactivas (ej. prompt, alert)</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 md:hidden">
           <Button variant="outline" size="sm" asChild>
            <Link href="/challenges">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
           <Button size="sm" onClick={() => setIsAssignModalOpen(true)} className="gap-1.5">
               <Send className="h-4 w-4" />
                Asignar
            </Button>
        </div>
      </div>
       {isAssignModalOpen && (
        <AssignChallengeModal
          challengeId={challengeIdStr}
          challengeTitle={title}
          onClose={() => setIsAssignModalOpen(false)}
        />
      )}
    </>
  );
}

