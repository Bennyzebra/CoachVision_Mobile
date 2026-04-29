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
            className="rounded-md p-1 text-muted-foreground/70 opacity-70 transition-all hover:bg-muted/60 hover:text-foreground group-hover:opacity-100"
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <Badge variant="secondary" className="gap-1">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    );
  };

  const totalPlanTime =
    calculateTotalTime(plan.warmup) +
    calculateTotalTime(plan.main_segment) +
    calculateTotalTime(plan.cool_down);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Practice Plan Overview</CardTitle>
            <Badge className="gap-1 text-base">
              <Clock className="h-4 w-4" />
              Total: {totalPlanTime} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{plan.coach_notes}</p>
          </div>
        </CardContent>
      </Card>

      {plan.warmup.length > 0 && renderSection("Warm-up", plan.warmup, "warmup")}
      
      {plan.main_segment.length > 0 &&
        renderSection("Main Segment", plan.main_segment, "main_segment")}
  
      {plan.cool_down.length > 0 && renderSection("Cool Down", plan.cool_down, "cool_down")}
      
      {onSaveAndContinue && (
        <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t">
          <Button
            onClick={onSaveAndContinue}
            disabled={isSaving}
            size="lg"
            className="w-full h-14 text-lg gap-3"
          >
            <Play className="h-5 w-5" />
            {isSaving ? "Saving..." : "Save and Continue to Practice"}
          </Button>
        </div>
      )}
    </div>
  );
};
