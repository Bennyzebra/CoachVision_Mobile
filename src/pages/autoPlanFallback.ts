import type { Drill, PlanItem } from "@/types";

export type GeneratedPracticePlan = {
  warmup: Drill[];
  main_segment: Drill[];
  cool_down: Drill[];
  coach_notes: string;
};

export const createGeneratedPlanFromFallback = (
  fallbackPlan: Array<Pick<PlanItem, "drillId" | "duration" | "segment" | "explainWhy">>,
  availableDrills: Drill[]
): GeneratedPracticePlan | null => {
  const drillLookup = new Map(availableDrills.map((drill) => [drill.id, drill]));
  const generatedPlan: GeneratedPracticePlan = {
    warmup: [],
    main_segment: [],
    cool_down: [],
    coach_notes: "Generated locally based on your practice defaults.",
  };

  fallbackPlan.forEach((item) => {
    const drill = drillLookup.get(item.drillId);
    if (!drill) return;

    const drillWithDuration = {
      ...drill,
      duration: item.duration,
      explainWhy: item.explainWhy,
    };

    if (item.segment === "warmup") {
      generatedPlan.warmup.push(drillWithDuration);
    } else if (item.segment === "cooldown") {
      generatedPlan.cool_down.push(drillWithDuration);
    } else {
      generatedPlan.main_segment.push(drillWithDuration);
    }
  });

  const hasDrills =
    generatedPlan.warmup.length > 0 ||
    generatedPlan.main_segment.length > 0 ||
    generatedPlan.cool_down.length > 0;

  return hasDrills ? generatedPlan : null;
};
