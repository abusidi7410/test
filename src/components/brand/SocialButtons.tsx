import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const providers = [
  {
    name: "Google",
    slug: "google",
    color: "#EA4335",
    path: "M21.35 11.1H12v2.9h5.35c-.23 1.5-1.72 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.44l2.56-2.47C16.7 3.94 14.55 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.63-3.66 8.63-8.82 0-.59-.07-1.04-.28-2.08z",
  },
  {
    name: "Facebook",
    slug: "facebook",
    color: "#1877F2",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z",
  },
  {
    name: "TikTok",
    slug: "tiktok",
    color: "#010101",
    path: "M20 8.5a6.6 6.6 0 0 1-4-1.3v7.3a5.5 5.5 0 1 1-5.5-5.5c.3 0 .55.03.85.07v2.83a2.7 2.7 0 1 0 1.9 2.6V2h2.75A4.15 4.15 0 0 0 20 5.75V8.5Z",
  },
];

function handleSocialLogin(slug: string) {
  window.location.href = `${API_BASE}/auth/social/${slug}/redirect`;
}

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
          onClick={() => handleSocialLogin(p.slug)}
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
