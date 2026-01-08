
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

const challengeTemplates = {
  javascript: {
    title: "Sumar dos números en JavaScript",
    description: "Crea una función llamada 'suma' que acepte dos números como parámetros y devuelva su suma.",
    testCases: `[\n  {\n    "input": [2, 2],\n    "expectedOutput": 4\n  },\n  {\n    "input": [5, -3],\n    "expectedOutput": 2\n  }\n]`
  },
  python: {
    title: "Concatenar dos strings en Python",
    description: "Crea una función llamada 'concatenar' que acepte dos strings y devuelva una única string con ambos.",
    testCases: `[\n  {\n    "input": ["Hola, ", "Mundo"],\n    "expectedOutput": "Hola, Mundo"\n  },\n  {\n    "input": ["Python ", "es genial"],\n    "expectedOutput": "Python es genial"\n  }\n]`
  },
  java: {
    title: "Invertir una cadena en Java",
    description: "Crea un método que reciba una cadena y devuelva la cadena invertida.",
    testCases: `[\n  {\n    "input": ["hola"],\n    "expectedOutput": "aloh"\n  },\n  {\n    "input": ["Java"],\n    "expectedOutput": "avaJ"\n  }\n]`
  },
  sql: {
    title: "Seleccionar usuarios activos",
    description: "Escribe una consulta SQL para seleccionar todos los usuarios de la tabla 'usuarios' donde la columna 'activo' sea verdadera.",
    testCases: `[\n  {\n    "input": "SELECT * FROM usuarios WHERE activo = true;",\n    "expectedOutput": {\n      "rowCount": 2\n    }\n  }\n]`
  },
  mysql: {
    title: "Crear una tabla de productos en MySQL",
    description: "Escribe una consulta DDL para crear una tabla llamada 'productos' con 'id' (INT, PK), 'nombre' (VARCHAR(100)) y 'precio' (DECIMAL(10, 2)).",
    testCases: `[\n  {\n    "input": "CREATE TABLE productos (id INT PRIMARY KEY, nombre VARCHAR(100), precio DECIMAL(10, 2));",\n    "expectedOutput": {\n      "schema_created": true\n    }\n  }\n]`
  },
  csharp: {
    title: "Verificar si un número es primo en C#",
    description: "Crea un método que devuelva 'true' si un número es primo y 'false' si no lo es.",
    testCases: `[\n  {\n    "input": [7],\n    "expectedOutput": true\n  },\n  {\n    "input": [10],\n    "expectedOutput": false\n  }\n]`
  },
  cpp: {
    title: "Calcular el factorial en C++",
    description: "Implementa una función para calcular el factorial de un número entero no negativo.",
    testCases: `[\n  {\n    "input": [5],\n    "expectedOutput": 120\n  },\n  {\n    "input": [0],\n    "expectedOutput": 1\n  }\n]`
  },
  typescript: {
    title: "Filtrar un array de objetos en TypeScript",
    description: "Dada una interfaz 'User' con 'id' y 'name', filtra un array de usuarios para obtener solo a los que se llamen 'Ana'.",
    testCases: `[\n  {\n    "input": [[{ "id": 1, "name": "Ana" }, { "id": 2, "name": "Luis" }]],\n    "expectedOutput": [{ "id": 1, "name": "Ana" }]\n  }\n]`
  },
  go: {
    title: "Encontrar el máximo en un slice en Go",
    description: "Escribe una función que encuentre el número más grande en un slice de enteros.",
    testCases: `[\n  {\n    "input": [[1, 9, 3, 5]],\n    "expectedOutput": 9\n  }\n]`
  },
  rust: {
    title: "Verificar si es palíndromo en Rust",
    description: "Escribe una función que determine si una cadena es un palíndromo (se lee igual hacia adelante y hacia atrás).",
    testCases: `[\n  {\n    "input": ["anilina"],\n    "expectedOutput": true\n  },\n  {\n    "input": ["rust"],\n    "expectedOutput": false\n  }\n]`
  },
  swift: {
    title: "Convertir Celsius a Fahrenheit en Swift",
    description: "Crea una función que convierta una temperatura de grados Celsius a Fahrenheit usando la fórmula (C * 9/5) + 32.",
    testCases: `[\n  {\n    "input": [0],\n    "expectedOutput": 32\n  },\n  {\n    "input": [100],\n    "expectedOutput": 212\n  }\n]`
  },
  kotlin: {
    title: "Sumar elementos de una lista en Kotlin",
    description: "Escribe una función que sume todos los números en una lista de enteros.",
    testCases: `[\n  {\n    "input": [[1, 2, 3, 4]],\n    "expectedOutput": 10\n  }\n]`
  },
  php: {
    title: "Validar una dirección de email en PHP",
    description: "Usa la función filter_var para validar si una cadena es una dirección de correo electrónico válida.",
    testCases: `[\n  {\n    "input": ["test@example.com"],\n    "expectedOutput": true\n  },\n  {\n    "input": ["texto-invalido"],\n    "expectedOutput": false\n  }\n]`
  },
  ruby: {
    title: "Contar vocales en una cadena en Ruby",
    description: "Escribe un método que cuente el número de vocales (a, e, i, o, u) en una cadena.",
    testCases: `[\n  {\n    "input": ["Hola Mundo"],\n    "expectedOutput": 4\n  }\n]`
  }
};

type LanguageWithTemplate = keyof typeof challengeTemplates;

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
  
  useEffect(() => {
    if (language in challengeTemplates) {
      const template = challengeTemplates[language as LanguageWithTemplate];
      setTitle(template.title);
      setDescription(template.description);
      setTestCases(template.testCases);
    }
  }, [language]);


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
