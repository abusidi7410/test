import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <span className="text-sm font-bold">T</span>
      </div>
      {!mark && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Tech<span className="text-primary">Hub</span>
        </span>
      )}
    </div>
  );
}