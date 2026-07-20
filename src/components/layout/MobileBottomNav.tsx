import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, Send, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Send", url: "/transfer", icon: Send },
  { title: "History", url: "/transactions", icon: Receipt },
  { title: "Profile", url: "/profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.url;
          return (
            <li key={it.url}>
              <Link
                to={it.url}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <it.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span>{it.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}