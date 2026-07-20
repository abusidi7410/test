import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { ShieldCheck, Zap, Sparkles } from "lucide-react";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Logo className="mb-10" />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-secondary lg:block">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(1200px 600px at 100% 0%, oklch(0.35 0.15 27) 0%, transparent 60%), radial-gradient(900px 500px at 0% 100%, oklch(0.28 0.05 260) 0%, transparent 55%), linear-gradient(135deg, oklch(0.18 0.02 260) 0%, oklch(0.22 0.03 260) 100%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">T</span>
            </div>
            <span className="text-lg font-bold tracking-tight">TechHub</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-8"
          >
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                Banking, bills, and payments — reimagined.
              </h2>
              <p className="text-white/70">
                Fund your wallet, pay bills, transfer instantly, and convert airtime to
                cash — all in one secure platform trusted by thousands.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { icon: Zap, label: "Instant transfers", desc: "Under 3 seconds average." },
                { icon: ShieldCheck, label: "Bank-grade security", desc: "256-bit encryption & 2FA." },
                { icon: Sparkles, label: "Best rates guaranteed", desc: "Cheap data, airtime & bills." },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary-foreground">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-xs text-white/60">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="text-xs text-white/50">© 2026 TechHub Financial Technologies</div>
        </div>
      </div>
    </div>
  );
}