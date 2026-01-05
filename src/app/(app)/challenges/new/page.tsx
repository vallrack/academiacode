import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewChallengePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/challenges">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          New Challenge
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/challenges">Cancel</Link>
          </Button>
          <Button size="sm">Save Challenge</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Challenge Details</CardTitle>
          <CardDescription>
            Fill out the form below to create a new coding challenge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  className="w-full"
                  placeholder='e.g. "Two Sum"'
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="language">Language</Label>
                <Select>
                    <SelectTrigger id="language" aria-label="Select language">
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="csharp">C#</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                        <SelectItem value="swift">Swift</SelectItem>
                        <SelectItem value="kotlin">Kotlin</SelectItem>
                        <SelectItem value="php">PHP</SelectItem>
                        <SelectItem value="ruby">Ruby</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the challenge, including the problem statement, constraints, and examples."
                className="min-h-32"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="test-cases">Test Cases</Label>
              <Textarea
                id="test-cases"
                placeholder="Enter test cases in JSON format. e.g., [{'input': [2, 7, 11, 15], 'target': 9, 'output': [0, 1]}]"
                className="min-h-32 font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>
       <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link href="/challenges">Cancel</Link>
          </Button>
          <Button size="sm">Save Challenge</Button>
        </div>
    </div>
  );
}
