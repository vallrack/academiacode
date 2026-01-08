
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export const dynamic = 'force-dynamic';

export default function NewChallengePage() {
  const [title, setTitle] = useState("Sumar dos números en JavaScript");
  const [language, setLanguage] = useState("javascript");
  const [category, setCategory] = useState("Semana 1");
  const [description, setDescription] = useState("Crea una función llamada 'suma' que acepte dos números como parámetros y devuelva su suma.");
  const [testCases, setTestCases] = useState(`[
  {
    "input": [2, 2],
    "expectedOutput": 4
  },
  {
    "input": [5, -3],
    "expectedOutput": 2
  },
  {
    "input": [100, 200],
    "expectedOutput": 300
  }
]`);
  const [allowInteractive, setAllowInteractive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSave = async () => {
    if (!title || !description || !language || !category) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, completa todos los campos obligatorios.",
      });
      return;
    }
    
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: "Debes iniciar sesión para crear un desafío.",
      });
      return;
    }

    try {
        JSON.parse(testCases);
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Error en los Casos de Prueba",
            description: "El formato de los casos de prueba no es un JSON válido. Por favor, corrígelo.",
        });
        return;
    }


    setIsSaving(true);

    const challengeData = {
      title,
      description,
      language,
      category,
      testCases,
      allowInteractiveApis: allowInteractive,
      status: "draft",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
        const challengesCollection = collection(firestore, 'challenges');
        await addDoc(challengesCollection, challengeData);
        
        toast({
          title: "¡Desafío Guardado!",
          description: `El desafío "${title}" ha sido guardado correctamente.`,
        });
        router.push("/challenges");

    } catch (serverError: any) {
        console.error("Error saving challenge: ", serverError);

        const permissionError = new FirestorePermissionError({
            path: 'challenges',
            operation: 'create',
            requestResourceData: challengeData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: `No se pudo guardar el desafío. Verifica que tienes el rol correcto (Profesor o Admin).`,
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/challenges">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Nuevo Desafío
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/challenges">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Desafío"}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Desafío</CardTitle>
          <CardDescription>
            Completa el formulario para crear un nuevo desafío de código.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  type="text"
                  className="w-full"
                  placeholder='ej. "Two Sum"'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="language">Lenguaje</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" aria-label="Selecciona un lenguaje">
                    <SelectValue placeholder="Selecciona un lenguaje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
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
              <Input
                id="category"
                type="text"
                className="w-full"
                placeholder='ej. "Semana 1", "Conceptos Básicos"'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Proporciona una descripción detallada del desafío, incluyendo el enunciado del problema, restricciones y ejemplos."
                className="min-h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="test-cases">Casos de Prueba (JSON)</Label>
              <Textarea
                id="test-cases"
                placeholder='Define tus casos de prueba como un array de JSON. Ejemplo: [{"input": [1, 2], "expectedOutput": 3}, {"input": [-1, 1], "expectedOutput": 0}]'
                className="min-h-32 font-mono"
                value={testCases}
                onChange={(e) => setTestCases(e.target.value)}
              />
            </div>
             <div className="flex items-center space-x-2">
                <Switch 
                  id="interactive-mode"
                  checked={allowInteractive}
                  onCheckedChange={setAllowInteractive}
                />
                <Label htmlFor="interactive-mode">Permitir APIs interactivas (ej. prompt, alert)</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-center gap-2 md:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href="/challenges">Cancelar</Link>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Desafío"}
        </Button>
      </div>
    </div>
  );
}
