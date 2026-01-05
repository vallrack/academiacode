
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

const studentCode = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
};`;

export default function SessionPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const student = {
    name: "Alice Johnson",
    avatarId: "student-avatar-1",
  }
  const studentAvatar = PlaceHolderImages.find(p => p.id === student.avatarId);
  const instructorAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  const handleRunCode = () => {
    toast({
      title: "Ejecutando Pruebas",
      description: "El código del estudiante se está ejecutando contra los casos de prueba.",
    });
  };

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Tabs defaultValue="ide" className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="ide"><CodeXml className="mr-2 h-4 w-4" /> Modo IDE</TabsTrigger>
              <TabsTrigger value="whiteboard"><MonitorPlay className="mr-2 h-4 w-4" /> Pizarra</TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="flex items-center gap-2 border-yellow-500/50 text-yellow-600">
                <ShieldAlert className="h-4 w-4" />
                <span>Supervisión por IA Activa</span>
            </Badge>
          </div>
          <TabsContent value="ide" className="mt-4 flex-grow">
            <Card className="flex h-full flex-col">
                <CardHeader>
                    <CardTitle>main.js</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <Textarea
                        defaultValue={studentCode}
                        className="h-full resize-none border-0 bg-muted/50 font-mono text-sm focus-visible:ring-0"
                        aria-label="Editor de Código"
                    />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="whiteboard" className="mt-4 flex-grow">
            <Card className="h-full">
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
            <CardContent className="flex flex-wrap items-center justify-center gap-2">
                {instructorAvatar && (
                    <div className="relative h-24 w-40 overflow-hidden rounded-md bg-muted">
                        <Image fill src={instructorAvatar.imageUrl} className="object-cover" alt="Video del Instructor" data-ai-hint={instructorAvatar.imageHint}/>
                        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">Dr. Evans (Tú)</div>
                    </div>
                )}
                 {studentAvatar && (
                    <div className="relative h-24 w-40 overflow-hidden rounded-md bg-muted">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText /> Desafío: Two Sum</CardTitle>
            <CardDescription>Encuentra dos números que sumen el objetivo.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-4">Dado un array de enteros `nums` y un entero `target`, devuelve los índices de los dos números que suman `target`.</p>
            <p>Puedes asumir que cada entrada tendría exactamente una solución, y no puedes usar el mismo elemento dos veces.</p>
          </CardContent>
          <div className="mt-auto flex flex-col gap-4 p-4">
             <Separator />
             <div>
                <h3 className="mb-2 font-semibold">Casos de Prueba</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="font-mono">Entrada: [2,7,11,15], 9</span><Badge variant="secondary">Pasó</Badge></div>
                    <div className="flex items-center justify-between"><span className="font-mono">Entrada: [3,2,4], 6</span><Badge variant="secondary">Pasó</Badge></div>
                    <div className="flex items-center justify-between"><span className="font-mono">Entrada: [3,3], 6</span><Badge variant="destructive">Falló</Badge></div>
                </div>
             </div>
             <Button className="w-full" onClick={handleRunCode}><Play className="mr-2 h-4 w-4" /> Ejecutar Código y Probar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

    