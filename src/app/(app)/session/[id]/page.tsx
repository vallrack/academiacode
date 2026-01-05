
"use client";

import Image from 'next/image';
import { CodeXml, FileText, Mic, MonitorPlay, PanelRight, Play, Share2, ShieldAlert, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from 'react';
import { analyzeStudentActivity } from '@/ai/ai-anti-cheating';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Skeleton } from '@/components/ui/skeleton';

type TestCaseStatus = "pending" | "passed" | "failed";

type TestCase = {
  input: string;
  status: TestCaseStatus;
};


export default function SessionPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const student = {
    name: "Alice Johnson",
    avatarId: "student-avatar-1",
  }
  const studentAvatar = PlaceHolderImages.find(p => p.id === student.avatarId);
  const instructorAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  const firestore = useFirestore();
  const challengeRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'challenges', params.id);
  }, [firestore, params.id]);

  const { data: challenge, isLoading: isLoadingChallenge } = useDoc<DocumentData>(challengeRef);


  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "[2,7,11,15], 9", status: "pending" },
    { input: "[3,2,4], 6", status: "pending" },
    { input: "[3,3], 6", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [aiReport, setAiReport] = useState<{ risk: string; report: string } | null>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [studentCode, setStudentCode] = useState('');

  useEffect(() => {
    // We could load saved code here in the future
    // For now, we'll leave it empty.
    setStudentCode('');
  }, [challenge]);
  

  const handleRunCode = async () => {
    if (!challenge) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha podido cargar el desafío.",
      });
      return;
    }

    setIsRunning(true);
    setAiReport(null);
    toast({
      title: "Ejecutando Análisis...",
      description: "El código y la actividad del estudiante están siendo analizados por la IA.",
    });

    try {
      const currentCode = codeTextareaRef.current?.value || '';
      
      // AI analysis
      const analysisResult = await analyzeStudentActivity({
        studentCode: currentCode,
        examDetails: `Challenge: ${challenge.title}. Description: ${challenge.description}`,
        allowInteractiveApis: challenge.allowInteractiveApis,
        // videoDataUri and screenDataUri can be added here in a real implementation
      });

      setAiReport({
        risk: analysisResult.riskAssessment,
        report: analysisResult.report
      });

      if (analysisResult.riskAssessment.toLowerCase() !== 'low') {
        toast({
          variant: "destructive",
          title: `Riesgo de Trampa Detectado: ${analysisResult.riskAssessment}`,
          description: "La IA ha marcado una posible irregularidad. Revisa el reporte.",
        });
      } else {
         toast({
          title: "Análisis de IA Completo",
          description: "No se detectaron riesgos significativos.",
        });
      }


      // Simulate test cases execution
      setTimeout(() => {
          setTestCases([
              { input: "[2,7,11,15], 9", status: "passed" },
              { input: "[3,2,4], 6", status: "passed" },
              { input: "[3,3], 6", status: "failed" },
          ]);
          setIsRunning(false);
      }, 1000);

    } catch (error) {
      console.error("AI analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Error en el Análisis de IA",
        description: "No se pudo completar el análisis de la IA.",
      });
      setIsRunning(false);
    }
  };

  const getBadgeVariant = (status: TestCaseStatus) => {
    switch (status) {
        case "passed":
            return "secondary";
        case "failed":
            return "destructive";
        default:
            return "outline";
    }
  };

  const getBadgeText = (status: TestCaseStatus) => {
    switch (status) {
        case "passed":
            return "Pasó";
        case "failed":
            return "Falló";
        default:
            return "Pendiente";
    }
  }

  const getRiskVariant = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default'; // yellow-ish
      default:
        return 'secondary';
    }
  };


  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Tabs defaultValue="ide" className="flex h-full flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <TabsList className='w-full sm:w-auto'>
              <TabsTrigger value="ide" className='flex-1'><CodeXml className="mr-2 h-4 w-4" /> Modo IDE</TabsTrigger>
              <TabsTrigger value="whiteboard" className='flex-1'><MonitorPlay className="mr-2 h-4 w-4" /> Pizarra</TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="flex items-center gap-2 border-yellow-500/50 text-yellow-600 w-full sm:w-auto justify-center">
                <ShieldAlert className="h-4 w-4" />
                <span>Supervisión por IA Activa</span>
            </Badge>
          </div>
          <TabsContent value="ide" className="mt-4 flex-grow">
            <Card className="flex h-full flex-col">
                <CardHeader>
                    <CardTitle>main.{challenge?.language === 'python' ? 'py' : 'js'}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <Textarea
                        ref={codeTextareaRef}
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        placeholder="Escribe tu código aquí..."
                        className="h-full min-h-[300px] resize-none border-0 bg-muted/50 font-mono text-sm focus-visible:ring-0"
                        aria-label="Editor de Código"
                        disabled={isLoadingChallenge}
                    />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="whiteboard" className="mt-4 flex-grow">
            <Card className="h-full min-h-[400px]">
              <CardContent className="flex h-full items-center justify-center rounded-lg bg-muted/50 p-6">
                <p className="text-muted-foreground">Área de pizarra para dibujo colaborativo.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  {studentAvatar && <AvatarImage src={studentAvatar.imageUrl} alt={student.name} data-ai-hint={studentAvatar.imageHint} />}
                  <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>En línea</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                {instructorAvatar && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                        <Image fill src={instructorAvatar.imageUrl} className="object-cover" alt="Video del Instructor" data-ai-hint={instructorAvatar.imageHint}/>
                        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">Dr. Evans (Tú)</div>
                    </div>
                )}
                 {studentAvatar && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                        <Image fill src={studentAvatar.imageUrl} className="object-cover" alt="Video del Estudiante" data-ai-hint={studentAvatar.imageHint}/>
                        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">{student.name}</div>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-around p-4">
                <Button variant="outline" size="icon"><Mic className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon"><Video className="h-5 w-5"/></Button>
                <Button variant="outline" size="icon"><Share2 className="h-5 w-5"/></Button>
                <Button variant="destructive" size="icon"><PanelRight className="h-5 w-5"/></Button>
            </CardFooter>
        </Card>

        <Card className="flex flex-grow flex-col">
            {isLoadingChallenge ? (
                <div className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            ) : challenge ? (
                <>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Desafío: {challenge.title}</CardTitle>
                    <CardDescription>{challenge.language}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4 text-sm">
                    <div>
                    <p className="mb-4 whitespace-pre-wrap">{challenge.description}</p>
                    </div>
                    {aiReport && (
                        <Alert variant={getRiskVariant(aiReport.risk)}>
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Reporte de la IA (Riesgo: {aiReport.risk})</AlertTitle>
                        <AlertDescription>
                            {aiReport.report}
                        </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                </>
            ) : (
                <CardContent className="flex flex-col items-center justify-center text-center flex-grow">
                    <p className='text-destructive'>No se pudo cargar el desafío.</p>
                </CardContent>
            )}

            <div className="mt-auto flex flex-col gap-4 p-4">
                <Separator />
                <div>
                    <h3 className="mb-2 font-semibold">Casos de Prueba</h3>
                    <div className="space-y-2 text-sm">
                        {testCases.map((testCase, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="font-mono">Entrada: {testCase.input}</span>
                                <Badge variant={getBadgeVariant(testCase.status)}>{getBadgeText(testCase.status)}</Badge>
                            </div>
                        ))}
                    </div>
                </div>
                <Button className="w-full" onClick={handleRunCode} disabled={isRunning || isLoadingChallenge}>
                    {isRunning ? "Ejecutando..." : <><Play className="mr-2 h-4 w-4" /> Ejecutar Código y Probar</>}
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}

    