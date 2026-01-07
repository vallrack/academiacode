
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Send, AlertCircle, BookOpen, Code, Terminal, BrainCircuit, CheckCircle, XCircle, ShieldAlert, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useParams } from 'next/navigation';
import { analyzeStudentActivity, type AIAntiCheatingInput, type AIAntiCheatingOutput } from '@/ai/ai-anti-cheating';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function SessionIDEPage() {
  const params = useParams();
  const challengeId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAntiCheatingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const challengeRef = useMemoFirebase(() => {
    if (!firestore || !challengeId) return null;
    return doc(firestore, 'challenges', challengeId);
  }, [firestore, challengeId]);

  const { data: challenge, isLoading: isLoadingChallenge, error: docError } = useDoc<DocumentData>(challengeRef);
  
  const testCases = React.useMemo(() => {
    if (!challenge?.testCases) return [];
    try {
        return JSON.parse(challenge.testCases);
    } catch {
        return [];
    }
  }, [challenge]);

  useEffect(() => {
    if (docError) {
      console.error('Error cargando documento:', docError);
      setError('Error al cargar el desafío desde la base de datos');
    }
  }, [docError]);

  useEffect(() => {
    if (!challenge) return;
    
    const challengeTitle = challenge.title || 'Desafío sin título';
    const language = challenge.language || 'javascript';
    let template = `// Desafío: ${challengeTitle}\n// Lenguaje: ${language}\n\n// Escribe tu código aquí\n`;

    switch (language) {
      case 'javascript':
      case 'typescript':
        template = `/**\n * ${challengeTitle}\n */\nfunction solve() {\n  // Escribe tu código aquí\n  \n}\n`;
        break;
      case 'python':
        template = `# ${challengeTitle}\n\ndef solve():\n    # Escribe tu código aquí\n    pass\n`;
        break;
      case 'java':
        template = `// ${challengeTitle}\n\nclass Solution {\n    public static void main(String[] args) {\n        // Escribe tu código aquí\n    }\n}\n`;
        break;
      case 'csharp':
          template = `// ${challengeTitle}\n\nusing System;\n\npublic class Program {\n    public static void Main(string[] args) {\n        // Escribe tu código aquí\n    }\n}\n`;
          break;
      case 'cpp':
          template = `// ${challengeTitle}\n\n#include <iostream>\n\nint main() {\n    // Escribe tu código aquí\n    return 0;\n}\n`;
          break;
      case 'go':
          template = `// ${challengeTitle}\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // Escribe tu código aquí\n}\n`;
          break;
      case 'rust':
          template = `// ${challengeTitle}\n\nfn main() {\n    // Escribe tu código aquí\n}\n`;
          break;
      case 'swift':
          template = `// ${challengeTitle}\n\nimport Foundation\n\n// Escribe tu código aquí\n`;
          break;
      case 'kotlin':
          template = `// ${challengeTitle}\n\nfun main() {\n    // Escribe tu código aquí\n}\n`;
          break;
      case 'php':
          template = `<?php\n\n// ${challengeTitle}\n\n// Escribe tu código aquí\n\n?>`;
          break;
      case 'ruby':
          template = `# ${challengeTitle}\n\n# Escribe tu código aquí\n`;
          break;
    }
    setCode(template);
  }, [challenge]);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('Ejecutando simulación...');

    // Simulate running against the first test case
    setTimeout(() => {
        if (testCases.length > 0) {
            const firstCase = testCases[0];
            const simulatedOutput = `--- Simulación de Ejecución ---\nInput: ${JSON.stringify(firstCase.input)}\nSalida Esperada: ${JSON.stringify(firstCase.expectedOutput)}\n\n(Esta es una simulación. El resultado real será evaluado al enviar.)`;
            setOutput(simulatedOutput);
        } else {
            setOutput('No hay casos de prueba para simular. Añade casos de prueba al desafío.');
        }
        setIsRunning(false);
        toast({
            title: 'Simulación Completa',
            description: 'Se ha simulado la ejecución con el primer caso de prueba.',
        });
    }, 1500);
  };
  
  const handleSubmitCode = async () => {
    if (!challenge) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se ha cargado ningún desafío para evaluar.'
        });
        return;
    }

    setIsSubmitting(true);
    setAnalysisResult(null);
    toast({
        title: 'Evaluando con IA...',
        description: 'Tu código está siendo analizado. Esto puede tardar un momento.'
    });

    try {
        const input: AIAntiCheatingInput = {
            studentCode: code,
            examDetails: `Desafío: ${challenge.title}. Descripción: ${challenge.description}`,
            testCases: challenge.testCases || '[]',
            allowInteractiveApis: challenge.allowInteractiveApis || false,
        };

        const result = await analyzeStudentActivity(input);
        setAnalysisResult(result);
        toast({
            title: '¡Análisis Completado!',
            description: 'El informe de la IA está listo a continuación.',
        });
    } catch (err: any) {
        console.error('Error durante el análisis de IA:', err);
        toast({
            variant: 'destructive',
            title: 'Error en la IA',
            description: err.message || 'No se pudo completar el análisis del código.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: 'Acción no permitida',
      description: 'No está permitido pegar código en el editor.',
    });
  };

  if (isLoadingChallenge || !challengeId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="w-full max-w-4xl space-y-4 p-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || docError) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || docError?.message || 'Ocurrió un error al cargar el desafío'}
          </AlertDescription>
        </Alert>
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

  const getRiskBadgeVariant = (risk: string | undefined) => {
    switch (risk?.toLowerCase()) {
        case 'alto': return 'destructive';
        case 'medio': return 'secondary';
        case 'bajo':
        default: return 'default';
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-muted/40 px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold truncate">{challenge.title || 'Desafío'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRunCode} disabled={isRunning} variant="secondary">
            <Play className="mr-2 h-4 w-4"/>
            {isRunning ? 'Ejecutando...' : 'Ejecutar'}
          </Button>
          <Button onClick={handleSubmitCode} disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4"/>
            {isSubmitting ? 'Evaluando...' : 'Enviar'}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <ResizablePanelGroup direction="horizontal" className="min-h-full">
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="flex h-full flex-col p-4 gap-4 overflow-auto">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Descripción del Desafío</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none flex-1">
                  <p>{challenge.description || 'Sin descripción disponible'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5" />
                        Casos de Prueba
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {testCases.length > 0 ? (
                        <div className="space-y-3">
                            {testCases.map((tc: any, index: number) => (
                                <div key={index} className="text-xs font-mono bg-muted p-3 rounded-md">
                                    <p><span className="font-semibold">Input:</span> {JSON.stringify(tc.input)}</p>
                                    <p><span className="font-semibold">Output Esperado:</span> {JSON.stringify(tc.expectedOutput)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No se han definido casos de prueba para este desafío.</p>
                    )}
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
                    Editor de Código ({challenge.language || 'desconocido'})
                  </h2>
                  <Textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onPaste={handlePaste}
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
                  <div className="flex-1 rounded-md bg-muted p-4 overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{output || 'La salida de tu código aparecerá aquí.'}</pre>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        {analysisResult && (
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <BrainCircuit className="text-primary"/>
                            Informe de Análisis de IA
                        </CardTitle>
                        <CardDescription>Resultados de la evaluación de tu código por parte de la IA.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <ShieldAlert />
                                Evaluación de Riesgo de Trampa
                            </h3>
                            <Badge variant={getRiskBadgeVariant(analysisResult.riskAssessment)}>{analysisResult.riskAssessment || 'Indeterminado'}</Badge>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Informe Detallado</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.report}</p>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Resultados de los Casos de Prueba</h3>
                            <div className="space-y-4">
                                {analysisResult.testCaseResults.map((result, index) => (
                                    <div key={index} className={`p-4 rounded-md border ${result.status === 'passed' ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700' : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">Caso de Prueba #{index + 1}</p>
                                            {result.status === 'passed' ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"><CheckCircle className="mr-1.5 h-4 w-4"/>Pasó</Badge>
                                            ) : (
                                                <Badge variant="destructive"><XCircle className="mr-1.5 h-4 w-4"/>Falló</Badge>
                                            )}
                                        </div>
                                        <div className="mt-3 text-xs font-mono text-muted-foreground space-y-2">
                                            <p><span className="font-semibold text-foreground">Input:</span> {JSON.stringify(result.input)}</p>
                                            <p><span className="font-semibold text-foreground">Salida Esperada:</span> {JSON.stringify(result.expectedOutput)}</p>
                                            {result.actualOutput !== undefined &&
                                                <p><span className="font-semibold text-foreground">Salida Real (según la IA):</span> {JSON.stringify(result.actualOutput)}</p>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
}
