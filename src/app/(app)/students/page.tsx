import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Students</h1>
            <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Student
            </Button>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Student Roster</CardTitle>
            <CardDescription>View and manage enrolled students and groups.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  You have no students
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add students to start assigning challenges.
                </p>
                <Button className="mt-4">Add Student</Button>
              </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
