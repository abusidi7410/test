import { Button } from "@/components/ui/button";

const providers = [
  { name: "Google", color: "#EA4335", path: "M21.35 11.1H12v2.9h5.35c-.23 1.5-1.72 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.44l2.56-2.47C16.7 3.94 14.55 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.63-3.66 8.63-8.82 0-.59-.07-1.04-.28-2.08z" },
  { name: "Facebook", color: "#1877F2", path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" },
  { name: "Apple", color: "#000000", path: "M16.36 12.7c-.02-2.36 1.93-3.5 2.02-3.55-1.1-1.6-2.82-1.83-3.43-1.85-1.45-.15-2.85.86-3.59.86-.75 0-1.9-.84-3.12-.82-1.6.02-3.08.93-3.9 2.37-1.68 2.9-.43 7.18 1.2 9.53.79 1.15 1.72 2.44 2.94 2.4 1.18-.05 1.63-.77 3.06-.77 1.43 0 1.83.77 3.08.75 1.27-.02 2.08-1.16 2.86-2.32.9-1.34 1.28-2.65 1.3-2.72-.03-.01-2.5-.96-2.52-3.88ZM14.16 5.5c.65-.79 1.09-1.89.97-2.98-.94.04-2.08.63-2.75 1.41-.6.7-1.13 1.82-.99 2.89 1.05.08 2.13-.53 2.77-1.32Z" },
  { name: "Microsoft", color: "#00A4EF", path: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" },
  { name: "X", color: "#000000", path: "M18.244 2H21l-6.52 7.45L22 22h-6.79l-4.75-6.22L4.98 22H2.22l6.98-7.98L2 2h6.94l4.31 5.71L18.24 2Zm-2.38 18h1.87L7.24 4h-2z" },
  { name: "TikTok", color: "#010101", path: "M20 8.5a6.6 6.6 0 0 1-4-1.3v7.3a5.5 5.5 0 1 1-5.5-5.5c.3 0 .55.03.85.07v2.83a2.7 2.7 0 1 0 1.9 2.6V2h2.75A4.15 4.15 0 0 0 20 5.75V8.5Z" },
];

export function SocialButtons() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {providers.map((p) => (
        <Button
          key={p.name}
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 rounded-xl border-border bg-card px-2 text-xs font-medium hover:bg-muted"
          aria-label={`Continue with ${p.name}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={p.color}>
            <path d={p.path} />
          </svg>
          <span className="hidden sm:inline">{p.name}</span>
        </Button>
      ))}
    </div>
  );
}