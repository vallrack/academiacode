
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Tipo de datos para el curso
interface Course {
    id: string;
    title: string;
    thumbnailUrl: string;
}

interface CourseCardProps {
    course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
    const courseUrl = `/courses/${course.id}`;

    return (
        <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader className="p-0">
                <div className="aspect-video relative">
                    <Image 
                        src={course.thumbnailUrl || '/placeholder.svg'}
                        alt={`Portada de ${course.title}`}
                        fill
                        className="object-cover"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg font-semibold leading-snug hover:text-primary transition-colors">
                    <Link href={courseUrl}>{course.title}</Link>
                </CardTitle>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full" size="sm">
                    <Link href={courseUrl}>Ver Curso</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export function CourseCardSkeleton() {
    return (
        <Card>
            <div className="aspect-video bg-muted" />
            <CardContent className="p-4">
                <div className="space-y-2">
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}
