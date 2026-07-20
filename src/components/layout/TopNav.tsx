import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Eye,
  EyeOff,
  MessageSquare,
  Moon,
  Search,
  Sun,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useWallet, useUnreadNotificationCount } from "@/lib/queries";
import { formatNaira } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

export function TopNav() {
  const [showBalance, setShowBalance] = useState(true);
  const { theme, toggle } = useTheme();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const walletQuery = useWallet();
  const unreadQuery = useUnreadNotificationCount();

  const wallet = walletQuery.data;
  const unreadCount = unreadQuery.data ?? 0;

  const fullName = authUser ? `${authUser.first_name} ${authUser.last_name}` : "";
  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("") || "?";
  const firstName = authUser?.first_name ?? "";

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="relative ml-1 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions, services…"
          className="h-9 rounded-full bg-muted/60 pl-9"
        />
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
          <span className="text-[11px] font-medium text-muted-foreground">Balance</span>
          <span className="text-sm font-semibold tabular-nums">
            {showBalance ? formatNaira(wallet?.balance ?? 0) : "••••••"}
          </span>
          <button
            onClick={() => setShowBalance((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle balance"
          >
            {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Messages">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifications"
          asChild
        >
          <Link to="/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={toggle}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition hover:bg-muted">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{firstName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{fullName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {authUser?.email ?? ""}
              </span>
              <Badge variant="secondary" className="mt-2 w-fit text-[10px]">
                Level 1
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
