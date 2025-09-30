import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Handshake,
  FolderOpen,
  BarChart3,
  DollarSign,
  Key,
  FileText,
  HeadphonesIcon,
  Receipt,
  UserCheck,
  Building2, // Import Building2 icon
} from "lucide-react";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Usuarios", href: "/admin/users" },
  { icon: Handshake, label: "Partners", href: "/admin/partners" },
  { icon: FolderOpen, label: "Proyectos", href: "/admin/projects" },
  { icon: HeadphonesIcon, label: "Soporte", href: "/admin/support" },
  { icon: FileText, label: "Portfolio", href: "/admin/portfolio" },
  { icon: UserCheck, label: "Modalidades", href: "/admin/work-modalities" },
  { icon: Building2, label: "Datos Empresa", href: "/admin/company-billing" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
];

const partnerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: DollarSign, label: "Ganancias", href: "/partner/earnings" },
  { icon: Users, label: "Referencias", href: "/partner/referrals" },
  { icon: Key, label: "Licencias", href: "/partner/licenses" },
  { icon: FileText, label: "Reportes", href: "/partner/reports" },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderOpen, label: "Mis Proyectos", href: "/client/projects" },
  { icon: HeadphonesIcon, label: "Soporte", href: "/client/support" },
  { icon: Receipt, label: "Facturación", href: "/client/billing" },
  { icon: Building2, label: "Datos de Facturación", href: "/client/billing-info" }, // Added new item
];

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "admin":
        return adminNavItems;
      case "partner":
        return partnerNavItems;
      case "client":
        return clientNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]">
      <nav className="p-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href) && !navItems.some(otherItem => 
              otherItem.href !== item.href && 
              otherItem.href.length > item.href.length && 
              location.startsWith(otherItem.href)
            ));

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}