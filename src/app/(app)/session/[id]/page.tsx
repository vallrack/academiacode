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
  const student = {
    name: "Alice Johnson",
    avatarId: "student-avatar-1",
  }
  const studentAvatar = PlaceHolderImages.find(p => p.id === student.avatarId);
  const instructorAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');


  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Tabs defaultValue="ide" className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="ide"><CodeXml className="mr-2 h-4 w-4" /> IDE Mode</TabsTrigger>
              <TabsTrigger value="whiteboard"><MonitorPlay className="mr-2 h-4 w-4" /> Whiteboard</TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="flex items-center gap-2 border-yellow-500/50 text-yellow-600">
                <ShieldAlert className="h-4 w-4" />
                <span>AI Proctoring Active</span>
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
                        aria-label="Code Editor"
                    />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="whiteboard" className="mt-4 flex-grow">
            <Card className="h-full">
              <CardContent className="flex h-full items-center justify-center rounded-lg bg-muted/50 p-6">
                <p className="text-muted-foreground">Whiteboard area for collaborative drawing.</p>
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
                    <CardDescription>Online</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-center gap-2">
                {instructorAvatar && (
                    <div className="relative h-24 w-40 overflow-hidden rounded-md bg-muted">
                        <Image fill src={instructorAvatar.imageUrl} className="object-cover" alt="Instructor Video" data-ai-hint={instructorAvatar.imageHint}/>
                        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">Dr. Evans (You)</div>
                    </div>
                )}
                 {studentAvatar && (
                    <div className="relative h-24 w-40 overflow-hidden rounded-md bg-muted">
                        <Image fill src={studentAvatar.imageUrl} className="object-cover" alt="Student Video" data-ai-hint={studentAvatar.imageHint}/>
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
            <CardTitle className="flex items-center gap-2"><FileText /> Challenge: Two Sum</CardTitle>
            <CardDescription>Find two numbers that add up to the target.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-4">Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.</p>
            <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
          </CardContent>
          <div className="mt-auto flex flex-col gap-4 p-4">
             <Separator />
             <div>
                <h3 className="mb-2 font-semibold">Test Cases</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="font-mono">Input: [2,7,11,15], 9</span><Badge variant="secondary">Passed</Badge></div>
                    <div className="flex items-center justify-between"><span className="font-mono">Input: [3,2,4], 6</span><Badge variant="secondary">Passed</Badge></div>
                    <div className="flex items-center justify-between"><span className="font-mono">Input: [3,3], 6</span><Badge variant="destructive">Failed</Badge></div>
                </div>
             </div>
             <Button className="w-full"><Play className="mr-2 h-4 w-4" /> Run Code & Test</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
