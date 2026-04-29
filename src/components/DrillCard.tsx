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
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{drill.name}</h3>
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
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              <span className="font-medium">{drill.rating}</span>
            </div>
            {dragHandle}

          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground mb-3">{drill.description}</p>
        {drill.explainWhy && (
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-medium text-foreground">Why this drill:</span> {drill.explainWhy}
          </p>
        )}        
        <div className="text-sm">
          <span className="font-medium">Duration:</span> {drill.duration} min
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        {onView && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onView(drill.id)}
          >
            View Details
          </Button>
        )}
        {onRemove && (
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onRemove(drill.id)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}        
        {onAdd && (
          <Button
            className="flex-1 gap-2"
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
