import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Challenges</h1>
            <Button className="ml-auto" asChild>
                <Link href="/challenges/new">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    New Challenge
                </Link>
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Challenge Library</CardTitle>
            <CardDescription>Manage and create coding challenges here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  No challenges created yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get started by creating a new challenge.
                </p>
                <Button className="mt-4" asChild>
                    <Link href="/challenges/new">New Challenge</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
