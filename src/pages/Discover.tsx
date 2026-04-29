import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DrillFocus } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import { DrillCard } from "@/components/DrillCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, CheckCircle2 } from "lucide-react";

const Discover = () => {
  const { state, addToPlan, loadDrillsFromDatabase, drillsLoading, drillsError, hasLoadedDrills } = useAppState();
  const navigate = useNavigate();
  const [focusFilter, setFocusFilter] = useState<DrillFocus | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "duration" | "focus">("name");
  
  useEffect(() => {
    if (state.drills.length === 0 && !hasLoadedDrills) {
    }
  }, [state.drills.length, hasLoadedDrills, loadDrillsFromDatabase]);
  // Get drill IDs already in the plan
  const planDrillIds = new Set(state.plan.map((item) => item.drillId));
  
  // Filter out drills that are already in the plan
  const verifiedDrills = state.drills.filter((d) => d.verified && !planDrillIds.has(d.id));  
  const filteredDrills = verifiedDrills.filter((drill) => {
    return focusFilter === "all" || drill.focus === focusFilter;
  });

    const sortedDrills = [...filteredDrills].sort((a, b) => {
    if (sortBy === "duration") {
      return a.duration - b.duration;
    }

    if (sortBy === "focus") {
      return a.focus.localeCompare(b.focus);
    }

    return a.name.localeCompare(b.name);
  });

  const focuses: Array<DrillFocus | "all"> = ["all", "offense", "defense", "passing", "conditioning"];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Discover</h1>
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Verified drills from experienced coaches
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {focuses.map((focus) => (
          <Button
            key={focus}
            variant={focusFilter === focus ? "default" : "outline"}
            size="sm"
            onClick={() => setFocusFilter(focus)}
            className="capitalize"
          >
            {focus}
          </Button>
        ))}
              <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort drills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="focus">Focus</SelectItem>
            </SelectContent>
          </Select>
        </div> 
      </div>

      {drillsError && (
        <div className="text-center py-12">
          <p className="text-destructive">Couldn't load drills: {drillsError}</p>
          <div className="mt-4">
            <Button onClick={loadDrillsFromDatabase}>Retry</Button>
          </div>
        </div>
      )}

      {drillsLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading drills…</p>
        </div>
      ) : filteredDrills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No verified drills found</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDrills.map((drill) => (
          <DrillCard
              key={drill.id}
              drill={drill}
              onAdd={addToPlan}
              onView={(id) => navigate(`/drill/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Discover;
