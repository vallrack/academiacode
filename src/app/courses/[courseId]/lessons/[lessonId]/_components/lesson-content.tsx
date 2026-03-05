
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LessonContentProps {
  description?: string;
}

export function LessonContent({ description }: LessonContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookText size={20} /> Sobre esta lección</CardTitle>
      </CardHeader>
      <CardContent>
        {description ? (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-muted-foreground">Aún no hay una descripción para esta lección.</p>
        )}
      </CardContent>
    </Card>
  );
}
