import { Drill } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, CheckCircle2, Clock, Users, Zap } from "lucide-react";

interface SuggestedDrillCardProps {
  drill: Drill;
  onAddToPlan?: (drillId: string) => void;
  isAdded?: boolean;
}

export const SuggestedDrillCard = ({ drill, onAddToPlan, isAdded }: SuggestedDrillCardProps) => {
  const focusColors: Record<string, string> = {
    offense: "bg-secondary/80 text-secondary-foreground",
    defense: "bg-primary/80 text-primary-foreground",
    passing: "bg-accent/80 text-accent-foreground",
    conditioning: "bg-orange-500/80 text-white",
    shooting: "bg-green-500/80 text-white",
    "ball-movement": "bg-blue-500/80 text-white",
  };

  const levelColors: Record<string, string> = {
    beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  // Get 1-2 key tags to display
  const displayTags = (drill.tags || []).slice(0, 2);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-4">
      {/* Left side: Drill info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{drill.name}</h4>
          {drill.verified && (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${focusColors[drill.focus] || focusColors.offense}`}>
            {drill.focus}
          </Badge>
          
          {drill.level && (
            <Badge variant="outline" className={`text-xs ${levelColors[drill.level] || ""}`}>
              {drill.level}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{drill.duration}m</span>
          </div>
          
          {drill.rating > 0 && (
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{drill.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Key tags */}
        {displayTags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {displayTags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Add button */}
      {onAddToPlan && (
        <Button
          size="sm"
          variant={isAdded ? "secondary" : "default"}
          className="flex-shrink-0 gap-1.5"
          onClick={() => onAddToPlan(drill.id)}
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pinned</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pin for Plan</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};
