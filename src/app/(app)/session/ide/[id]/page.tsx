'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFirestore } from "@/firebase";
import { doc, type DocumentData, addDoc, collection, serverTimestamp, getDoc, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Send, AlertCircle, BookOpen, Code, Terminal, BrainCircuit, CheckCircle, XCircle, ShieldAlert, ListChecks, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useParams } from 'next/navigation';
import { analyzeStudentActivity } from '@/ai/ai-anti-cheating';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase/auth/use-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';


// Define types inline as they are no longer exported from the 'use server' file
type AIAntiCheatingInput = {
    studentCode: string;
    examDetails: string;
    testCases: string;
    allowInteractiveApis: boolean;
};

type AIAntiCheatingOutput = {
    report: string;
    riskAssessment: string;
    testCaseResults: Array<{
        input: any;
        expectedOutput: any;
        status: 'passed' | 'failed';
        actualOutput?: any;
    }>;
    grade: number;
    developedSkills: string[];
};

// Feature flag to quickly enable/disable screen recording
const ENABLE_RECORDING = false;

export default function SessionIDEPage() {
  const params = useParams();
  const challengeId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAntiCheatingOutput | null>(null);
  
  const [challenge, setChallenge] = useState<DocumentData | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [previousAttempts, setPreviousAttempts] = useState(0);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasScreenPermission, setHasScreenPermission] = useState(!ENABLE_RECORDING); // Default to true if recording is off
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const isHtmlChallenge = challenge?.language === 'html';

  useEffect(() => {
    if (!firestore || !challengeId) {
      setIsLoadingChallenge(false);
      setLoadingAttempts(false);
      return;
    }
    
    setIsLoadingChallenge(true);
    const challengeRef = doc(firestore, 'challenges', challengeId);
    
    const fetchChallenge = async () => {
        try {
            const docSnap = await getDoc(challengeRef);
            if (docSnap.exists()) {
                setChallenge(docSnap.data());
            } else {
                setError('No se pudo encontrar el desafío solicitado.');
            }
        } catch (err) {
            console.error('Error cargando documento:', err);
            setError('Error al cargar el desafío desde la base de datos.');
        } finally {
            setIsLoadingChallenge(false);
        }
    };
    
    fetchChallenge();

  }, [firestore, challengeId]);
  
  useEffect(() => {
    if (!firestore || !user || !challengeId) return;

    setLoadingAttempts(true);
    const submissionsQuery = query(
      collection(firestore, 'submissions'),
      where('studentId', '==', user.uid),
      where('challengeId', '==', challengeId)
    );
    
    getCountFromServer(submissionsQuery).then(snapshot => {
      setPreviousAttempts(snapshot.data().count);
      setLoadingAttempts(false);
    }).catch(err => {
      console.error("Error fetching attempts count:", err);
      setLoadingAttempts(false);
    });

  }, [firestore, user, challengeId]);
  
  const testCases = React.useMemo(() => {
    if (!challenge?.testCases) return [];
    try {
        return JSON.parse(challenge.testCases);
    } catch {
        return [];
    }
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    
    const challengeTitle = challenge.title || 'Desafío sin título';
    const language = challenge.language || 'javascript';
    let template = `// Desafío: ${challengeTitle}\n// Lenguaje: ${language}\n\n// Escribe tu código aquí\n`;

    switch (language) {
      case 'html':
        template = `<!DOCTYPE html>\n<html>\n<head>\n    <title>${challengeTitle}</title>\n    <style>\n        /* Escribe tu CSS aquí */\n\n    </style>\n</head>\n<body>\n    <h1>Mi Desafío</h1>\n    <!-- Escribe tu HTML aquí -->\n\n</body>\n</html>`;
        break;
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
      case 'sql':
      case 'mysql':
        template = `/*\n * ${challengeTitle}\n * \n * Escribe tu consulta SQL aquí.\n * Por ejemplo: SELECT * FROM users;\n */\n\n`;
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
  
  const canAttempt = challenge?.maxAttempts > 0 ? previousAttempts < challenge.maxAttempts : true;

  useEffect(() => {
    if (!challengeId || !canAttempt || !ENABLE_RECORDING) return;

    const startScreenRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setHasScreenPermission(true);
        screenStreamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);
        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstart = () => {
          setIsRecording(true);
        };

        mediaRecorderRef.current.onstop = () => {
            setIsRecording(false);
            // Automatically stop screen sharing when recording stops
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
      } catch (err) {
        console.error("Error starting screen recording:", err);
        setHasScreenPermission(false);
        toast({
          variant: "destructive",
          title: "Permiso de grabación denegado",
          description: "Necesitas permitir la grabación de pantalla para enviar tu solución.",
        });
      }
    };

    startScreenRecording();

    return () => {
        mediaRecorderRef.current?.stop();
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [challengeId, canAttempt, toast]);


  const handleRunCode = () => {
    if (isHtmlChallenge) return;
    setIsRunning(true);
    setOutput('Ejecutando simulación...');

    setTimeout(() => {
        if (testCases.length > 0) {
            const firstCase = testCases[0];
            const simulatedOutput = `--- Simulación de Ejecución (no es una ejecución real) ---\n\nInput del primer caso de prueba:\n${JSON.stringify(firstCase.input, null, 2)}\n\nSalida Esperada para este caso:\n${JSON.stringify(firstCase.expectedOutput, null, 2)}\n\n(El resultado final será evaluado con todos los casos al momento de enviar.)`;
            setOutput(simulatedOutput);
        } else {
            setOutput('No hay casos de prueba definidos para este desafío. La evaluación se basará únicamente en el análisis de la IA.');
        }
        setIsRunning(false);
        toast({
            title: 'Simulación Completa',
            description: 'Se ha mostrado una simulación con el primer caso de prueba.',
        });
    }, 500);
  };
  
  const handleSubmitCode = async () => {
    if (!firestore || !user) return;
    
    setIsSubmitting(true);
    setAnalysisResult(null);
    mediaRecorderRef.current?.stop();

    let videoUrl = '';
    if (ENABLE_RECORDING && recordedChunksRef.current.length > 0) {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      // This is a placeholder for the upload logic
      try {
        const response = await fetch('/api/upload-recording', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            challengeId, 
            studentId: user.uid,
            // Sending blob as base64 string
            file: Buffer.from(await blob.arrayBuffer()).toString('base64')
          }),
        });
        const result = await response.json();
        if(response.ok) {
          videoUrl = result.url;
        } else {
          throw new Error(result.error || 'Failed to upload video');
        }
      } catch (uploadError) {
        console.error("Video upload failed:", uploadError);
        toast({ 
            variant: 'destructive',
            title: 'Error al subir la grabación',
            description: 'No se pudo guardar la grabación de tu pantalla. Tu intento será registrado sin video.'
        });
      }
    }

    try {
        const result = await analyzeStudentActivity({
            studentCode: code,
            examDetails: challenge?.description || '',
            testCases: challenge?.testCases || '[]',
            allowInteractiveApis: false
        });

        setAnalysisResult(result);

        await addDoc(collection(firestore, 'submissions'), {
            challengeId,
            studentId: user.uid,
            code,
            grade: result.grade,
            analysis: result,
            createdAt: serverTimestamp(),
            videoUrl: videoUrl,
        });

        toast({
            title: '¡Desafío Enviado!',
            description: 'Tu solución ha sido evaluada. Revisa los resultados.',
        });
    } catch (apiError) {
        console.error('Error en la API de análisis:', apiError);
        toast({
            variant: 'destructive',
            title: 'Error en la Evaluación',
            description: 'No se pudo completar la evaluación de tu código. Por favor, inténtalo de nuevo.',
        });
    } finally {
        setIsSubmitting(false);
        setPreviousAttempts(prev => prev + 1); // Optimistically update attempts count
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

  const noMoreAttempts = challenge?.maxAttempts > 0 && previousAttempts >= challenge.maxAttempts;
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
          if(textAreaRef.current) {
             textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 2;
          }
      }, 0);
    }
  };


  if (isLoadingChallenge || !challengeId || loadingAttempts) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex items-center justify-center h-full">
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
  }
  
  if (!challenge) {
    return (
         <div className="flex items-center justify-center h-full">
            <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Encontrado</AlertTitle>
                <AlertDescription>El desafío que estás buscando no existe o fue eliminado.</AlertDescription>
            </Alert>
        </div>
    );
  }
  
  const remainingAttempts = challenge.maxAttempts > 0 ? challenge.maxAttempts - previousAttempts : Infinity;
  

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-muted/40 px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold truncate">{challenge.title || 'Desafío'}</h1>
           {isRecording && ENABLE_RECORDING && (
            <div className="flex items-center gap-1.5 ml-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs text-red-500 font-medium">Grabando</span>
            </div>
          )}
        </div>
         <div className="flex items-center gap-2">
            {challenge.maxAttempts > 0 && (
                <Badge variant={noMoreAttempts ? "destructive" : "secondary"}>
                   Intentos restantes: {Math.max(0, remainingAttempts)}
                </Badge>
            )}
          <Button onClick={handleRunCode} disabled={isHtmlChallenge || isRunning || noMoreAttempts} variant="secondary">
            <Play className="mr-2 h-4 w-4"/>
            {isRunning ? 'Ejecutando...' : 'Ejecutar'}
          </Button>
          <Button onClick={handleSubmitCode} disabled={isSubmitting || noMoreAttempts || !hasScreenPermission}>
            <Send className="mr-2 h-4 w-4"/>
            {isSubmitting ? 'Evaluando...' : 'Enviar y Calificar'}
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
                            {isHtmlChallenge 
                              ? testCases.map((tc: any, index: number) => (
                                  <div key={index} className="text-sm bg-muted p-3 rounded-md">
                                      <p className="font-semibold">Verificación #{index + 1}:</p>
                                      {tc.selector && <p className="font-mono text-xs mt-1">Selector: <code>{tc.selector}</code></p>}
                                      {tc.style && <p className="font-mono text-xs">Propiedad CSS: <code>{tc.style}</code> debe ser <code>{tc.expected}</code></p>}
                                      {tc.textContent && <p className="font-mono text-xs">Contenido de texto debe ser: <code>{tc.textContent}</code></p>}
                                  </div>
                                ))
                              : testCases.map((tc: any, index: number) => (
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
              <ResizablePanel defaultSize={isHtmlChallenge ? 50 : 70} minSize={30}>
                <div className="flex h-full flex-col p-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4"/>
                    Editor de Código ({challenge.language || 'desconocido'})
                  </h2>
                  <Textarea 
                    ref={textAreaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu código aquí..."
                    className="flex-1 font-mono text-sm resize-none"
                    disabled={noMoreAttempts || !hasScreenPermission}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={isHtmlChallenge ? 50 : 30} minSize={15}>
                 {isHtmlChallenge ? (
                    <div className="flex h-full flex-col p-4">
                      <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4" />
                          Vista Previa
                      </h2>
                      <div className="flex-1 rounded-md bg-white border w-full h-full">
                          <iframe
                              srcDoc={code}
                              title="Vista Previa"
                              sandbox="allow-scripts"
                              width="100%"
                              height="100%"
                              style={{ border: 'none' }}
                          />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col p-4">
                      <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Terminal className="w-4 h-4" />
                        Salida
                      </h2>
                      <div className="flex-1 rounded-md bg-muted p-4 overflow-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">{output || 'La salida de tu código aparecerá aquí.'}</pre>
                      </div>
                    </div>
                  )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        <Dialog open={!!analysisResult} onOpenChange={() => setAnalysisResult(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary"/>
                Resultados de la Evaluación
              </DialogTitle>
              <DialogDescription>
                Análisis detallado de tu solución y calificación obtenida.
              </DialogDescription>
            </DialogHeader>
            {analysisResult && (
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl">Calificación: {analysisResult.grade}/5</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">La IA ha calificado tu solución en una escala de 1 a 5.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                           <CardTitle className="text-xl flex items-center gap-2">
                               <ShieldAlert className="h-5 w-5"/>
                               Riesgo de Plagio
                           </CardTitle>
                        </CardHeader>
                         <CardContent>
                           <p className="text-sm font-medium">{analysisResult.riskAssessment}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Reporte de la IA</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                      <p>{analysisResult.report}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resultados de los Casos de Prueba</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analysisResult.testCaseResults.map((result, index) => (
                                <div key={index} className={`p-3 rounded-md border ${result.status === 'passed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm">Caso de prueba #{index + 1}</p>
                                        {result.status === 'passed' 
                                            ? <Badge variant="default" className="bg-green-600"><CheckCircle className="h-4 w-4 mr-1"/> Aprobado</Badge>
                                            : <Badge variant="destructive"><XCircle className="h-4 w-4 mr-1"/> Fallido</Badge> }
                                    </div>
                                    {!isHtmlChallenge && (
                                      <div className="text-xs font-mono mt-2 space-y-1">
                                          <p><strong>Input:</strong> {JSON.stringify(result.input)}</p>
                                          <p><strong>Salida esperada:</strong> {JSON.stringify(result.expectedOutput)}</p>
                                          <p><strong>Tu salida:</strong> {JSON.stringify(result.actualOutput)}</p>
                                      </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Habilidades Desarrolladas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {analysisResult.developedSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                    </CardContent>
                </Card>

              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setAnalysisResult(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
