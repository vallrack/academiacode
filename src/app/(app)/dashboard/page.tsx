import Link from 'next/link';
import { ArrowUpRight, BookCopy, Users, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const liveSessions = [
    { name: 'Alice Johnson', challenge: 'Data Structures 101', progress: 75, avatarId: 'student-avatar-1' },
    { name: 'Bob Williams', challenge: 'Algorithm Design', progress: 40, avatarId: 'student-avatar-2' },
    { name: 'Charlie Brown', challenge: 'Database Intro', progress: 90, avatarId: 'student-avatar-3' },
    { name: 'Diana Prince', challenge: 'Full-Stack Project', progress: 20, avatarId: 'student-avatar-4' },
  ];
  const recentGrades = [
    { name: 'Eve Adams', challenge: 'Recursion Basics', grade: 'A', avatarId: 'student-avatar-5' },
    { name: 'Frank Miller', challenge: 'API Integration', grade: 'C+', avatarId: 'student-avatar-6' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">+2 since last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Challenges</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">+3 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+10 since last semester</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Student Sessions</CardTitle>
            <CardDescription>Monitor students' progress in real-time.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Challenge</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Progress</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveSessions.map((session, index) => {
                  const image = PlaceHolderImages.find(p => p.id === session.avatarId);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {image && <AvatarImage src={image.imageUrl} alt={session.name} data-ai-hint={image.imageHint} />}
                            <AvatarFallback>{session.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{session.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{session.challenge}</TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        <Badge variant="outline">{session.progress}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/session/${index + 1}`}>Join Session</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Grades</CardTitle>
              <CardDescription>Recently graded student submissions.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/results">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Challenge</TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentGrades.map((grade, index) => {
                       const image = PlaceHolderImages.find(p => p.id === grade.avatarId);
                       return (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        {image && <AvatarImage src={image.imageUrl} alt={grade.name} data-ai-hint={image.imageHint} />}
                                        <AvatarFallback>{grade.name.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">{grade.name}</div>
                                </div>
                            </TableCell>
                            <TableCell>{grade.challenge}</TableCell>
                            <TableCell className="text-right"><Badge variant="secondary">{grade.grade}</Badge></TableCell>
                        </TableRow>
                       );
                    })}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
