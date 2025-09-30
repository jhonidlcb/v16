import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import { Code } from "lucide-react";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { User } from "@/types"; // Assuming User type is defined elsewhere

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string; // Added subtitle as it's used in the changes
  user?: User; // Added user as it's used in the changes
}

function DashboardLayout({ children, title, subtitle, user }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Logo size="md" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Sidebar userRole={user?.role} />
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-w-0">
          <div className="min-w-0 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
export { DashboardLayout };