import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <TopNav />
        <main className="min-h-[calc(100vh-4rem)] p-4 pb-24 sm:p-6 md:pb-8">
          <Outlet />
        </main>
        <MobileBottomNav />
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
