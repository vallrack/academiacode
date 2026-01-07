
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Send, AlertCircle, BookOpen, Code, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function SessionIDEPage() {
  const params = useParams();
  const challengeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const challengeRef = useMemoFirebase(() => {
    if (!firestore || !challengeId) return null;
    return doc(firestore, 'challenges', challengeId);
  }, [firestore, challengeId]);

  const { data: challenge, isLoading: isLoadingChallenge } = useDoc<DocumentData>(challengeRef);

  useEffect(() => {
    // Placeholder for default code based on language
    if (challenge?.language === 'javascript') {
      setCode(`// ${challenge.title}\n\nfunction solve() {\n  // Escribe tu código aquí\n  return;\n}\n`);
    } else if (challenge?.language === 'python') {
        setCode(`# ${challenge.title}\n\ndef solve():\n    # Escribe tu código aquí\n    pass\n`);
    }
  }, [challenge]);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('Ejecutando código...');
    // Simulating code execution
    setTimeout(() => {
      setOutput(`Salida simulada para el código:\n\n${code}`);
      setIsRunning(false);
      toast({
        title: 'Ejecución Simulada',
        description: 'La lógica de ejecución real debe ser implementada.',
      });
    }, 1500);
  };
  
  const handleSubmitCode = () => {
      toast({
        title: 'Funcionalidad no implementada',
        description: 'La lógica para enviar y calificar el código aún no se ha conectado.',
        variant: 'destructive',
      });
  }


  if (isLoadingChallenge) {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
            <div className="w-full max-w-4xl space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
  }
  
  if (!challenge) {
    return (
       <div className="flex h-screen w-full items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error: Desafío no Encontrado</AlertTitle>
                <AlertDescription>
                No se pudo cargar el desafío solicitado. Puede que haya sido eliminado o el ID sea incorrecto.
                </AlertDescription>
            </Alert>
       </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-muted/40 px-4 lg:px-6">
            <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold">{challenge.title}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleRunCode} disabled={isRunning} variant="secondary">
                    <Play className="mr-2 h-4 w-4"/>
                    {isRunning ? 'Ejecutando...' : 'Ejecutar'}
                </Button>
                <Button onClick={handleSubmitCode}>
                    <Send className="mr-2 h-4 w-4"/>
                    Enviar
                </Button>
            </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={40} minSize={25}>
                <div className="flex h-full flex-col p-4 overflow-auto">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Descripción del Desafío</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                            <p>{challenge.description}</p>
                        </CardContent>
                    </Card>
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60} minSize={30}>
                <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={70} minSize={30}>
                        <div className="flex h-full flex-col p-4">
                            <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <Code className="w-4 h-4"/>
                                Editor de Código ({challenge.language})
                            </h2>
                            <Textarea 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Escribe tu código aquí..."
                                className="flex-1 font-mono text-sm resize-none"
                            />
                        </div>
                    </ResizablePanel>
                     <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={30} minSize={15}>
                        <div className="flex h-full flex-col p-4">
                            <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <Terminal className="w-4 h-4" />
                                Salida
                            </h2>
                            <div className="flex-1 rounded-md bg-muted p-4">
                                <pre className="text-sm font-mono whitespace-pre-wrap">{output || 'La salida de tu código aparecerá aquí.'}</pre>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  );
}
