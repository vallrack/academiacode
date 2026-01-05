
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";


export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Estudiantes</h1>
            <Button className="ml-auto" asChild>
                <Link href="/users/new">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Añadir Estudiante
                </Link>
            </Button>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Lista de Estudiantes</CardTitle>
            <CardDescription>Ver y administrar estudiantes y grupos inscritos.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  No tienes estudiantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Añade estudiantes para empezar a asignar desafíos.
                </p>
                <Button className="mt-4" asChild>
                    <Link href="/users/new">Añadir Estudiante</Link>
                </Button>
              </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
