import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  Send,
  ArrowDownToLine,
  Smartphone,
  Wifi,
  Coins,
  Zap,
  Tv,
  Globe,
  GraduationCap,
  Gift,
  Receipt,
  Users,
  Bell,
  User,
  Settings,
  LogOut,
  Landmark,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/Logo";

const groups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Wallet", url: "/wallet", icon: Wallet },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Fund Wallet", url: "/fund-wallet", icon: PlusCircle },
      { title: "Transfer", url: "/transfer", icon: Send },
      { title: "Withdraw", url: "/withdraw", icon: ArrowDownToLine },
    ],
  },
  {
    label: "Services",
    items: [
      { title: "Airtime", url: "/airtime", icon: Smartphone },
      { title: "Data", url: "/data", icon: Wifi },
      { title: "Airtime to Cash", url: "/airtime-to-cash", icon: Coins },
      { title: "Electricity", url: "/electricity", icon: Zap },
      { title: "Cable TV", url: "/cable-tv", icon: Tv },
      { title: "Internet", url: "/internet", icon: Globe },
      { title: "Education", url: "/education", icon: GraduationCap },
      { title: "Gift Cards", url: "/gift-cards", icon: Gift },
      { title: "Betting", url: "/betting", icon: Landmark },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Transactions", url: "/transactions", icon: Receipt },
      { title: "Referrals", url: "/referrals", icon: Users },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) => pathname === u;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="h-9 rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Logout"
              className="h-9 rounded-lg text-primary hover:bg-accent hover:text-accent-foreground"
            >
              <Link to="/login">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
