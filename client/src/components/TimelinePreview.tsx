
import { useQuery } from "@tanstack/react-query";
import { Badge } from "./ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface TimelinePreviewProps {
  projectId: number;
}

export default function TimelinePreview({ projectId }: TimelinePreviewProps) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "timeline"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${projectId}/timeline`);
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse h-12 bg-muted rounded"></div>
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay elementos en el timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {timeline.map((item: any) => (
        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
              <h4 className="font-medium text-xs sm:text-sm break-words">{item.title}</h4>
              <Badge 
                variant={
                  item.status === 'completed' ? 'default' :
                  item.status === 'in_progress' ? 'secondary' :
                  'outline'
                }
                className="text-[10px] sm:text-xs w-fit"
              >
                {item.status === 'completed' ? 'Completado' :
                 item.status === 'in_progress' ? 'En Progreso' :
                 'Pendiente'}
              </Badge>
            </div>
            {item.description && (
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 break-words">{item.description}</p>
            )}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
            {item.estimatedDate && (
              <span className="whitespace-nowrap">{new Date(item.estimatedDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
