import { Drill } from "@/types";
import { DrillCard } from "./DrillCard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Clock, GripVertical, Play } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GeneratedPlanProps {
  plan: {
    warmup: Drill[];
    main_segment: Drill[];
    cool_down: Drill[];
    coach_notes: string;
  };
  onReorder?: (updated: {
    warmup: Drill[];
    main_segment: Drill[];
    cool_down: Drill[];
  }) => void;  
  onAddDrill?: (drillId: string) => void;
  onViewDrill?: (drillId: string) => void;
  onSaveAndContinue?: () => void;
  addedDrillIds?: string[];
  isSaving?: boolean;
}

type PlanSegment = "warmup" | "main_segment" | "cool_down";

interface SortableDrillCardProps {
  drill: Drill;
  onAddDrill?: (drillId: string) => void;
  onViewDrill?: (drillId: string) => void;
  onRemoveDrill?: (drillId: string) => void;
  addedDrillIds: string[];
}

const SortableDrillCard = ({
  drill,
  onAddDrill,
  onViewDrill,
  onRemoveDrill,
  addedDrillIds,
}: SortableDrillCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: drill.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-shadow",
        isDragging ? "shadow-xl" : "hover:shadow-xl"
      )}
    >
      <DrillCard
        drill={drill}
        onAdd={onAddDrill}
        onView={onViewDrill}
        onRemove={onRemoveDrill}
        isAdded={addedDrillIds.includes(drill.id)}
        dragHandle={
          <button
            type="button"
            className="tap-target rounded-md p-2 text-muted-foreground/70 opacity-100 transition-all hover:bg-muted/60 hover:text-foreground md:opacity-70 md:group-hover:opacity-100"
            {...attributes}
            {...listeners}
            aria-label="Reorder drill"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
};

export const GeneratedPlan = ({
  plan,
  onReorder,  
  onAddDrill,
  onViewDrill,
  onSaveAndContinue,
  addedDrillIds = [],
  isSaving = false
}: GeneratedPlanProps) => {
  const calculateTotalTime = (drills: Drill[]) => {
    return drills.reduce((total, drill) => total + drill.duration, 0);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleReorder = (segment: PlanSegment, nextDrills: Drill[]) => {
    if (!onReorder) return;
    onReorder({
      warmup: segment === "warmup" ? nextDrills : plan.warmup,
      main_segment: segment === "main_segment" ? nextDrills : plan.main_segment,
      cool_down: segment === "cool_down" ? nextDrills : plan.cool_down,
    });
  };

  const handleDragEnd = (segment: PlanSegment, drills: Drill[], event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = drills.findIndex((drill) => drill.id === active.id);
    const newIndex = drills.findIndex((drill) => drill.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const nextDrills = arrayMove(drills, oldIndex, newIndex);
    handleReorder(segment, nextDrills);
  };

  const handleRemove = (segment: PlanSegment, drillId: string) => {
    const nextDrills = plan[segment].filter((drill) => drill.id !== drillId);
    handleReorder(segment, nextDrills);
  };

  const renderSection = (title: string, drills: Drill[], segment: PlanSegment) => {
  const totalTime = calculateTotalTime(drills);
    const drillIds = drills.map((drill) => drill.id);    

    return (
      <section className="space-y-3">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-y border-border/70 bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
          <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
          <Badge variant="secondary" className="gap-1 px-3 py-1.5">
            <Clock className="h-3 w-3" />
            {totalTime} min
          </Badge>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(segment, drills, event)}
        >
          <SortableContext items={drillIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
              {drills.map((drill) => (
                <SortableDrillCard
                  key={drill.id}
                  drill={drill}
                  onAddDrill={onAddDrill}
                  onViewDrill={onViewDrill}
                  onRemoveDrill={
                    onReorder ? (drillId) => handleRemove(segment, drillId) : undefined
                  }
                  addedDrillIds={addedDrillIds}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    );
  };

  const totalPlanTime =
    calculateTotalTime(plan.warmup) +
    calculateTotalTime(plan.main_segment) +
    calculateTotalTime(plan.cool_down);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="rounded-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl">Practice Plan Overview</CardTitle>
            <Badge className="w-fit gap-1 px-3 py-1.5 text-base">
              <Clock className="h-4 w-4" />
              Total: {totalPlanTime} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">{plan.coach_notes}</p>
          </div>
        </CardContent>
      </Card>

      {plan.warmup.length > 0 && renderSection("Warm-up", plan.warmup, "warmup")}
      
      {plan.main_segment.length > 0 &&
        renderSection("Main Segment", plan.main_segment, "main_segment")}
  
      {plan.cool_down.length > 0 && renderSection("Cool Down", plan.cool_down, "cool_down")}
      
      {onSaveAndContinue && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0 md:pb-6 md:pt-4">
          <Button
            onClick={onSaveAndContinue}
            disabled={isSaving}
            size="lg"
            className="h-14 w-full gap-3 text-base sm:text-lg"
          >
            <Play className="h-5 w-5" />
            {isSaving ? "Saving..." : "Save and Continue to Practice"}
          </Button>
        </div>
      )}
    </div>
  );
};
