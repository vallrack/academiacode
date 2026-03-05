
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsersDataTable } from "./users-data-table";

// TODO: Implementar la funcionalidad para crear un nuevo usuario
// import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        {/* 
        // TODO: Habilitar cuando la página de creación exista
        <Button asChild>
          <Link href="/admin/users/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button> 
        */}
      </div>
      <p className="mt-4 text-muted-foreground">
        Aquí podrás administrar los roles y el acceso de los usuarios a la plataforma.
      </p>

      <div className="mt-8">
        <UsersDataTable />
      </div>
      
    </div>
  );
}
