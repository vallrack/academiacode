
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import CoursesClientLoader from './courses-client-loader'; // Importamos nuestro nuevo componente

export default function AdminCoursesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Cursos</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Curso
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-muted-foreground">
        Aquí podrás crear, editar y administrar todos los cursos de tu plataforma.
      </p>

      {/* Renderizamos el componente de cliente que se encargará de la carga dinámica */}
      <CoursesClientLoader />
      
    </div>
  );
}
