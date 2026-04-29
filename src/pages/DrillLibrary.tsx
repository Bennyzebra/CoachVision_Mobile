import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DrillFocus } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import { DrillCard } from "@/components/DrillCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, AlertCircle } from "lucide-react";

const DrillLibrary = () => {
  const { state, addToPlan, drillsLoading, drillsError } = useAppState();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [focusFilter, setFocusFilter] = useState<DrillFocus | "all">("all");
  const [showAdded, setShowAdded] = useState(!state.profile.hideAddedByDefault);

  const addedDrillIds = new Set(state.plan.map((p) => p.drillId));

  const filteredDrills = state.drills.filter((drill) => {
    const matchesSearch = drill.name.toLowerCase().includes(search.toLowerCase()) ||
      drill.description.toLowerCase().includes(search.toLowerCase());
    const matchesFocus = focusFilter === "all" || drill.focus === focusFilter;
    const matchesAdded = showAdded || !addedDrillIds.has(drill.id);
    return matchesSearch && matchesFocus && matchesAdded;
  });

  const focuses: Array<DrillFocus | "all"> = ["all", "offense", "defense", "passing", "conditioning"];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-added"
            checked={showAdded}
            onCheckedChange={setShowAdded}
          />
          <Label htmlFor="show-added" className="cursor-pointer">
            Show added drills
          </Label>
        </div>
      </div>

      {drillsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {drillsError}
          </AlertDescription>
        </Alert>
      )}

      {drillsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredDrills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No drills found</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDrills.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onAdd={addToPlan}
              onView={(id) => navigate(`/drill/${id}`)}
              isAdded={addedDrillIds.has(drill.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DrillLibrary;
