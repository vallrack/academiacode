import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Resultados</h1>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Centro de Calificaciones</CardTitle>
            <CardDescription>Revisa y analiza los resultados de los envíos de los estudiantes.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  No hay resultados para mostrar
                </h3>
                <p className="text-sm text-muted-foreground">
                  Los resultados de los estudiantes aparecerán aquí después de que completen los desafíos.
                </p>
              </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
