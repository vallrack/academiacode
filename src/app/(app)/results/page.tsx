import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Results</h1>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Grading Center</CardTitle>
            <CardDescription>Review and analyze student submission results.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  No results to display
                </h3>
                <p className="text-sm text-muted-foreground">
                  Student results will appear here after they complete challenges.
                </p>
              </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
