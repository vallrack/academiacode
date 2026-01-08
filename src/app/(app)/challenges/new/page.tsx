
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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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

export default function NewChallengePage() {
  const [language, setLanguage] = useState<string>("javascript");
  const [title, setTitle] = useState(challengeTemplates.javascript.title);
  const [category, setCategory] = useState("Semana 1");
  const [description, setDescription] = useState(challengeTemplates.javascript.description);
  const [testCases, setTestCases] = useState(challengeTemplates.javascript.testCases);
  const [allowInteractive, setAllowInteractive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (language in challengeTemplates) {
      const template = challengeTemplates[language as LanguageWithTemplate];
      setTitle(template.title);
      setDescription(template.description);
      setTestCases(template.testCases);
    } else {
      // Si se selecciona un lenguaje sin plantilla, se pueden limpiar los campos o mantenerlos.
      // Por ahora, los mantendremos para que el usuario no pierda lo que ha escrito.
    }
  }, [language]);


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
