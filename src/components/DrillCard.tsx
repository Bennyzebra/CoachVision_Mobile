import { ReactNode } from "react";
import { Drill } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, CheckCircle2, Trash2 } from "lucide-react";
interface DrillCardProps {
  drill: Drill;
  onAdd?: (drillId: string) => void;
  onView?: (drillId: string) => void;
  isAdded?: boolean;
  onRemove?: (drillId: string) => void;
  dragHandle?: ReactNode;  
}

export const DrillCard = ({
  drill,
  onAdd,
  onView,
  isAdded,
  onRemove,
  dragHandle,
}: DrillCardProps) => {
const focusColors: Record<string, string> = {
    offense: "bg-secondary text-secondary-foreground",
    defense: "bg-primary text-primary-foreground",
    passing: "bg-accent text-accent-foreground",
    conditioning: "bg-destructive text-destructive-foreground",
  };

  return (
    <Card className="h-full flex flex-col rounded-xl hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="mb-2 text-base font-semibold leading-snug sm:text-lg">{drill.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={focusColors[drill.focus]}>
                {drill.focus}
              </Badge>
              {drill.verified && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              <span className="font-medium">{drill.rating}</span>
            </div>
            {dragHandle}

          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 px-4 pb-3 sm:px-6">
        <p className="mb-3 line-clamp-4 text-sm leading-6 text-muted-foreground sm:line-clamp-none">{drill.description}</p>
        {drill.explainWhy && (
          <p className="mb-3 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Why this drill:</span> {drill.explainWhy}
          </p>
        )}        
        <div className="text-sm">
          <span className="font-medium">Duration:</span> {drill.duration} min
        </div>
      </CardContent>
      
      <CardFooter className="flex-col gap-2 p-4 pt-0 sm:flex-row sm:p-6 sm:pt-0">
        {onView && (
          <Button
            variant="outline"
            className="h-11 w-full flex-1"
            onClick={() => onView(drill.id)}
          >
            View Details
          </Button>
        )}
        {onRemove && (
          <Button
            variant="outline"
            className="h-11 w-full flex-1 gap-2"
            onClick={() => onRemove(drill.id)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}        
        {onAdd && (
          <Button
            className="h-11 w-full flex-1 gap-2"
            onClick={() => onAdd(drill.id)}
            disabled={isAdded}
          >
            {isAdded ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Plan
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
