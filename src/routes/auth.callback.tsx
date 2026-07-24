import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TOKEN_KEY } from "@/lib/constants";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing your login...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      if (window.opener) {
        window.opener.postMessage(
          { type: "social-login-error", message: decodeURIComponent(error) },
          window.location.origin,
        );
        window.close();
        return;
      }
      toast.error(decodeURIComponent(error));
      navigate({ to: "/login" });
      return;
    }

    if (!token) {
      if (window.opener) {
        window.opener.postMessage(
          { type: "social-login-error", message: "No authentication token received." },
          window.location.origin,
        );
        window.close();
        return;
      }
      toast.error("No authentication token received. Please try again.");
      navigate({ to: "/login" });
      return;
    }

    if (window.opener) {
      window.opener.postMessage({ type: "social-login-success", token }, window.location.origin);
      setStatus("Login successful! Closing...");
      setTimeout(() => window.close(), 500);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    setStatus("Loading your account...");
    window.location.href = "/dashboard";
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
