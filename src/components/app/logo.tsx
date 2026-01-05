import { Code } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-primary", className)}>
      <Code className="h-5 w-5 text-primary-foreground" />
    </div>
  );
}
