import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, GripVertical, X, Play, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { savePractice } from "@/services/practiceService";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { Drill, PlanItem } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortablePlanItemProps {
  item: PlanItem;
  drill?: Drill;
  index: number;
  onRemove: (index: number) => void;
  onUpdateDuration: (index: number, duration: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const SortablePlanItem = ({ 
  item, 
  drill, 
  index,
  onRemove,
  onUpdateDuration,
  onMove,
  canMoveUp,
  canMoveDown,
}: SortablePlanItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.drillId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-3 rounded-xl">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-start gap-3">
          <div
            {...attributes}
            {...listeners}
              className="tap-target flex cursor-grab items-center justify-center rounded-lg border bg-muted/40 active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
            <div className="min-w-0 flex-1">
            <div className="font-medium mb-1">{drill?.name || "Unknown Drill"}</div>
            <Badge variant="outline" className="capitalize">
              {drill?.focus}
            </Badge>
          </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:ml-auto">
            <div className="flex items-center gap-1 sm:hidden">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => onMove(index, -1)} disabled={!canMoveUp}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => onMove(index, 1)} disabled={!canMoveDown}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="60"
              value={item.duration}
              onChange={(e) => onUpdateDuration(index, parseInt(e.target.value) || 1)}
                className="h-11 w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">min</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PracticePlan = () => {
  const { state, removeFromPlan, updatePlanItemDuration, reorderPlan, clearPlan } = useAppState();
  const catalog = state.drills;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam } = useTeam();  
  const [startingPractice, setStartingPractice] = useState(false);  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const totalDuration = state.plan.reduce((sum, item) => sum + (Number.isFinite(item.duration) ? item.duration : 0), 0);
  const target = Number.isFinite(Number(state.profile.sessionTarget)) ? Number(state.profile.sessionTarget) : 60;
  const difference = totalDuration - target;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = state.plan.findIndex((item) => item.drillId === active.id);
      const newIndex = state.plan.findIndex((item) => item.drillId === over.id);
      reorderPlan(arrayMove(state.plan, oldIndex, newIndex));
    }
  };

  const handleMovePlanItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= state.plan.length) return;
    reorderPlan(arrayMove(state.plan, index, nextIndex));
  };

  const handleStartPractice = async () => {
    if (!user) {
      toast.error("You must be logged in to start a practice");
      return;
    }

    if (state.plan.length === 0) {
      toast.error("Add drills to your plan first");
      return;
    }

    setStartingPractice(true);

    try {
      // Convert plan items to Drill objects for the main_segment
      const mainSegmentDrills: Drill[] = state.plan.map((item) => {
        const drill = catalog.find((d) => d.id === item.drillId);
        if (!drill) {
          // Create a minimal drill object if not found in catalog
          return {
            id: item.drillId,
            name: "Unknown Drill",
            focus: "offense" as const,
            duration: item.duration,
            rating: 0,
            description: "",
          };
        }
        // Return drill with the custom duration from the plan
        return {
          ...drill,
          duration: item.duration,
        };
      });

      const planDetails = {
        warmup: [] as Drill[],
        main_segment: mainSegmentDrills,
        cool_down: [] as Drill[],
        coach_notes: "",
      };

      const { data, error } = await savePractice(
        user.id,
        currentTeam?.id || null,
        totalDuration,
        planDetails
      );

      if (error) throw error;

      if (data) {
        toast.success("Practice started!");
        navigate(`/run?practiceId=${data.id}`);
      }
    } catch (error) {
      console.error("Error starting practice:", error);
      toast.error("Failed to start practice. Please try again.");
    } finally {
      setStartingPractice(false);
    }
  };
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Practice Plan</h1>
          <p className="text-muted-foreground">
            Build and organize your practice session
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-4 text-left sm:text-right">
          <div className="text-sm text-muted-foreground mb-1">Session Target</div>
          <div className="text-2xl font-bold">
            {totalDuration} / {target} min
          </div>
          {difference !== 0 && (
            <div className={`text-sm ${difference > 0 ? "text-destructive" : "text-primary"}`}>
              {difference > 0 ? "+" : ""}{difference} min
            </div>
          )}
        </div>
      </div>

      {state.plan.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No drills in your plan yet</p>
            <Button className="h-11 w-full sm:w-auto" onClick={() => navigate("/drills")}>
              Browse Drills
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={state.plan.map((p) => p.drillId)}
              strategy={verticalListSortingStrategy}
            >
              {state.plan.map((item, index) => {
                const drill = catalog.find((d) => d.id === item.drillId);
                return (
                  <SortablePlanItem
                    key={item.drillId}
                    item={item}
                    drill={drill}
                    index={index}
                    onRemove={removeFromPlan}
                    onUpdateDuration={updatePlanItemDuration}
                    onMove={handleMovePlanItem}
                    canMoveUp={index > 0}
                    canMoveDown={index < state.plan.length - 1}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-col gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:flex-wrap sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <Button
              size="lg"
              className="h-12 gap-2"
              onClick={handleStartPractice}
              disabled={startingPractice}
              >
              {startingPractice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Practice
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 gap-2"
              onClick={clearPlan}
            >
              <Trash2 className="h-4 w-4" />
              Clear Plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PracticePlan;
