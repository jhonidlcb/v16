import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import PartnerDashboard from "./PartnerDashboard";
import ClientDashboard from "./ClientDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "partner":
      return <PartnerDashboard />;
    case "client":
      return <ClientDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Rol no reconocido</h2>
            <p className="text-muted-foreground">No tienes permisos para acceder al dashboard.</p>
          </div>
        </div>
      );
  }
}