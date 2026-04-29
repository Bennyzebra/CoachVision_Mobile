import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Star,
  CheckCircle2,
  Square,
 SkipForward,
  Zap, 
} from "lucide-react";
import { toast } from "sonner";
import { getPractice, updatePracticeFeedback, Practice, PracticeDrillOutcome } from "@/services/practiceService";
type SlideState = "idle" | "sliding-out" | "sliding-in";

const calculatePlanDuration = (planDetails: Practice["plan_details"]) => {
  const sumDurations = (drills: Practice["plan_details"][keyof Practice["plan_details"]]) =>
    drills.reduce((total, drill) => total + (Number(drill.duration) || 0), 0);

  return (
    sumDurations(planDetails.warmup) +
    sumDurations(planDetails.main_segment) +
    sumDurations(planDetails.cool_down)
  );
};

type TimerMode = "total" | "drill";

const buildDrillSequence = (planDetails: Practice["plan_details"]) => [
  ...planDetails.warmup.map((drill) => ({ ...drill, segment: "Warmup" })),
  ...planDetails.main_segment.map((drill) => ({ ...drill, segment: "Main Segment" })),
  ...planDetails.cool_down.map((drill) => ({ ...drill, segment: "Cool Down" })),
];

const isValidPracticePayload = (value: unknown): value is Practice => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as Practice;
  const planDetails = candidate.plan_details as Practice["plan_details"] | undefined;

  return Boolean(
    candidate.id &&
      planDetails &&
      Array.isArray(planDetails.warmup) &&
      Array.isArray(planDetails.main_segment) &&
      Array.isArray(planDetails.cool_down)
  );
};

const RunPractice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const practiceId = searchParams.get("practiceId");

  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [drillTimeRemaining, setDrillTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [timerMode, setTimerMode] = useState<TimerMode>("total");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [slideState, setSlideState] = useState<SlideState>("idle");
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeSaved, setTimeSaved] = useState(0);
  const [showTimeSavedToast, setShowTimeSavedToast] = useState(false);
  const [lastSkipSaved, setLastSkipSaved] = useState(0);
 const [skippedDrillFills, setSkippedDrillFills] = useState<Map<number, number>>(new Map());
  const [timeBehind, setTimeBehind] = useState(0);
  const [showTimeBehindToast, setShowTimeBehindToast] = useState(false);
  const [lastOvertimeUsed, setLastOvertimeUsed] = useState(0);
  const [currentDrillOvertime, setCurrentDrillOvertime] = useState(0);  
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!practiceId) {
      toast.error("No practice ID provided");
      navigate("/");
      return;
    }

    const loadPractice = async () => {
      setLoading(true);
      const { data, error } = await getPractice(practiceId);

      if (error || !data) {
        toast.error("Failed to load practice");
        navigate("/");
        return;
      }

      if (!isValidPracticePayload(data)) {
        console.error("Unexpected practice payload shape returned from getPractice", {
          practiceId,
          payload: data,
        });
        toast.error("Practice data was invalid. Please try again.");
        navigate("/");
        return;
      }
      
      setPractice(data);
      setLoading(false);
    };

    loadPractice();
  }, [practiceId, navigate]);

  const drillSequence = useMemo(() => {
    if (!practice) return [];
    return buildDrillSequence(practice.plan_details);
  }, [practice]);
  
  const planDurationMinutes = practice ? calculatePlanDuration(practice.plan_details) : 0;
  const totalDurationMinutes = planDurationMinutes || practice?.duration || 0;
  const totalDurationSeconds = totalDurationMinutes * 60;

  useEffect(() => {
    if (!practice) return;

    const durationToUse = totalDurationMinutes || Number(practice.duration) || 0;
    const firstDrillDuration = drillSequence[0]?.duration || 0;

    setTotalTimeRemaining(durationToUse * 60);
    setCurrentDrillIndex(0);
    setDrillTimeRemaining(firstDrillDuration * 60);
  }, [practice, drillSequence, totalDurationMinutes]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTotalTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });

      setDrillTimeRemaining((prev) => {
        if (drillSequence.length === 0) return prev;
        if (prev <= 1) {
          // Drill timer is at 0, track overtime
          setCurrentDrillOvertime((overtime) => overtime + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, drillSequence.length]);

  useEffect(() => {
    if (totalTimeRemaining > 0 && showFeedback) {
      setShowFeedback(false);
    }
  }, [totalTimeRemaining, showFeedback]);

  const handleShowFeedback = () => {
    setShowFeedback(true);
    // Allow state update to render before scrolling
    setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const handleEndTimer = () => {
    setIsRunning(false);
    setTotalTimeRemaining(0);
    handleShowFeedback();
    setDrillTimeRemaining(0);    
  };

  const handleSubmitFeedback = async () => {
    const buildDrillOutcomes = (): PracticeDrillOutcome[] => {
      if (!practice) return [];
      return drillSequence.map((drill, index) => {
        const drillDurationSeconds = (drill.duration || 0) * 60;
        let completionPercent = 0;
        const wasSkipped = skippedDrillFills.has(index);

        if (wasSkipped) {
          completionPercent = skippedDrillFills.get(index) ?? 0;
        } else if (index < currentDrillIndex) {
          completionPercent = 100;
        } else if (index === currentDrillIndex) {
          const elapsedInDrill = Math.max(
            0,
            drillDurationSeconds - drillTimeRemaining + currentDrillOvertime
          );
          completionPercent = drillDurationSeconds > 0 ? (elapsedInDrill / drillDurationSeconds) * 100 : 0;
        }

        return {
          drillId: drill.id,
          completionPercent: Math.max(0, Math.min(100, completionPercent)),
          feedbackRating: feedbackRating,
          feedbackNotes: feedbackNotes.trim() ? feedbackNotes.trim() : null,
        };
      });
    };
    
    if (!practiceId) return;

    setIsSubmitting(true);

    try {
      const drillOutcomes = buildDrillOutcomes();
      const { error } = await updatePracticeFeedback(      
        practiceId,
        feedbackRating,
        feedbackNotes,
        drillOutcomes
      );
      
      if (error) throw error;

      // Clear the autoplan so the user sees a fresh "ready to plan" state
      window.sessionStorage.removeItem("coachvision-auto-plan-generated");      
      toast.success("Feedback submitted successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleNextDrill = useCallback(() => {
    if (drillSequence.length === 0 || isAnimating) return;
    if (currentDrillIndex >= drillSequence.length - 1) {
      setDrillTimeRemaining(0);
      return;
    }

    // Calculate time saved from skipping this drill (ahead of schedule)
    const timeRemainingOnDrill = drillTimeRemaining;
    if (timeRemainingOnDrill > 0) {
      setTimeSaved((prev) => prev + timeRemainingOnDrill);
      setLastSkipSaved(timeRemainingOnDrill);
      setShowTimeSavedToast(true);
      
      // Hide the toast after 3 seconds
      setTimeout(() => {
        setShowTimeSavedToast(false);
      }, 3000);
    }

    // Calculate time lost from going over on this drill (behind schedule)
    if (currentDrillOvertime > 0) {
      setTimeBehind((prev) => prev + currentDrillOvertime);
      setLastOvertimeUsed(currentDrillOvertime);
      setShowTimeBehindToast(true);
      
      // Hide the toast after 3 seconds
      setTimeout(() => {
        setShowTimeBehindToast(false);
      }, 3000);
    }   
    // Record the fill percentage for the skipped drill so it persists
    const drillDurationSeconds = (drillSequence[currentDrillIndex]?.duration || 0) * 60;
    const elapsedInDrill = drillDurationSeconds - drillTimeRemaining + currentDrillOvertime;
    const fillPercent = drillDurationSeconds > 0 ? (elapsedInDrill / drillDurationSeconds) * 100 : 0;
    
    setSkippedDrillFills(prev => {
      const newMap = new Map(prev);
      newMap.set(currentDrillIndex, fillPercent);
      return newMap;
    });
   
    setIsAnimating(true);
    setSlideState("sliding-out");

    // Reset overtime for next drill
    setCurrentDrillOvertime(0);
    // After slide-out animation completes, update drill and prepare for slide in
    setTimeout(() => {
      const nextIndex = currentDrillIndex + 1;
      setCurrentDrillIndex(nextIndex);
      setDrillTimeRemaining((drillSequence[nextIndex]?.duration || 0) * 60);
      // Set to sliding-in to position content on the right
      setSlideState("sliding-in");

      // Use requestAnimationFrame to ensure the DOM has updated with the new position
      // Then trigger the animation to slide into view
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlideState("idle");
          // Give time for the slide-in animation to complete
          setTimeout(() => {
            setIsAnimating(false);
          }, 300);
        });
      });
    }, 300);
  }, [drillSequence, currentDrillIndex, isAnimating, drillTimeRemaining, currentDrillOvertime]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Run Practice</h1>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Loading practice...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Run Practice</h1>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Practice not found</p>
            <Button onClick={() => navigate("/")}>
              Back to Auto Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  const practiceProgress = totalDurationSeconds
    ? Math.min(100, ((totalDurationSeconds - totalTimeRemaining) / totalDurationSeconds) * 100)
    : 0;

  const currentDrill = drillSequence[currentDrillIndex];
  const isLastDrill =
    drillSequence.length === 0 || currentDrillIndex >= drillSequence.length - 1;  
  const drillMinutes = Math.floor(drillTimeRemaining / 60);
  const drillSeconds = drillTimeRemaining % 60;
  const minutes = Math.floor(totalTimeRemaining / 60);
  const seconds = totalTimeRemaining % 60;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
    

      {/* Time Saved Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          showTimeSavedToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
          <Zap className="h-5 w-5" />
          <div className="text-center">
            <p className="font-bold text-lg">
              +{Math.floor(lastSkipSaved / 60)}:{String(lastSkipSaved % 60).padStart(2, "0")} saved!
            </p>
            <p className="text-sm text-green-100">
              You're now {Math.floor(timeSaved / 60)}:{String(timeSaved % 60).padStart(2, "0")} ahead of schedule
            </p>
          </div>
        </div>
      </div>

      {/* Time Behind Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          showTimeBehindToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
          <Clock className="h-5 w-5" />
          <div className="text-center">
            <p className="font-bold text-lg">
              -{Math.floor(lastOvertimeUsed / 60)}:{String(lastOvertimeUsed % 60).padStart(2, "0")} overtime
            </p>
            <p className="text-sm text-red-100">
              You're now {Math.floor(timeBehind / 60)}:{String(timeBehind % 60).padStart(2, "0")} behind schedule
            </p>
          </div>
        </div>
      </div>
      
      <Card className="border-2">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Practice
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* Ahead of Schedule Badge */}
              {timeSaved > 0 && (
                <Badge 
                  className="text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-1.5 animate-in fade-in duration-300"
                >
                  <Zap className="h-4 w-4" />
                  {Math.floor(timeSaved / 60)}:{String(timeSaved % 60).padStart(2, "0")} ahead
                </Badge>
              )}
              {/* Behind Schedule Badge */}
              {timeBehind > 0 && (
                <Badge 
                  className="text-base font-semibold bg-red-600 hover:bg-red-700 text-white gap-1.5 animate-in fade-in duration-300"
                >
                  <Clock className="h-4 w-4" />
                  {Math.floor(timeBehind / 60)}:{String(timeBehind % 60).padStart(2, "0")} behind
                </Badge>      
              )}              
              {drillSequence.length > 0 && (
                <Badge variant="secondary" className="text-base font-semibold">
                  Drill {currentDrillIndex + 1} of {drillSequence.length}
                </Badge>
              )}
              <Badge variant="outline" className="text-base">
                {totalDurationMinutes} minutes total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 p-1">
              <Button
              size="sm"
                variant={timerMode === "total" ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => setTimerMode("total")}
              >
                Total Timer
              </Button>
              <Button
                size="sm"
                variant={timerMode === "drill" ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => setTimerMode("drill")}
              >
                Drill-by-Drill
              </Button>
            </div>
          </div>

         <div className="space-y-4">
            {/* Segmented Progress Bar with Glow Effect */}
            <div 
              className="relative rounded-full p-[3px] transition-all duration-700"
              style={{
                boxShadow: practiceProgress > 0 
                  ? `0 0 ${Math.min(practiceProgress / 4, 20)}px ${Math.min(practiceProgress / 8, 10)}px rgba(0, 102, 204, ${Math.min(practiceProgress / 100 * 0.5, 0.4)}), 
                     0 0 ${Math.min(practiceProgress / 2.5, 35)}px ${Math.min(practiceProgress / 5, 15)}px rgba(0, 102, 204, ${Math.min(practiceProgress / 100 * 0.25, 0.2)})`
                  : 'inset 0 1px 3px rgba(0,0,0,0.1)',
                background: practiceProgress > 0 
                  ? `linear-gradient(90deg, 
                      rgba(245, 158, 11, ${0.15 + Math.min(practiceProgress / 100 * 0.35, 0.35)}) 0%, 
                      rgba(0, 102, 204, ${0.15 + Math.min(practiceProgress / 100 * 0.35, 0.35)}) 50%, 
                      rgba(59, 130, 246, ${0.15 + Math.min(practiceProgress / 100 * 0.35, 0.35)}) 100%)`
                  : 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(0, 102, 204, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)'
              }}
            >
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-muted/50">
                {drillSequence.map((drill, index) => {
                  const drillDurationSeconds = (drill.duration || 0) * 60;
                  const drillWidthPercent = totalDurationSeconds > 0 
                    ? (drillDurationSeconds / totalDurationSeconds) * 100 
                    : 0;
                  
                  // Calculate fill percentage for this segment
                  // Use skipped drill fills for drills that were skipped
                  let segmentFillPercent = 0;
                  const wasSkipped = skippedDrillFills.has(index);
                  
                  if (wasSkipped) {
                    // This drill was skipped - use the recorded fill percentage
                    segmentFillPercent = skippedDrillFills.get(index)!;
                  } else if (index < currentDrillIndex) {
                    // Drill before current that wasn't skipped - fully completed
                    segmentFillPercent = 100;
                  } else if (index === currentDrillIndex) {
                    // Current drill - calculate based on remaining time
                    const elapsedInDrill = drillDurationSeconds - drillTimeRemaining;
                    segmentFillPercent = drillDurationSeconds > 0 
                      ? (elapsedInDrill / drillDurationSeconds) * 100 
                      : 0;
                  } else {
                    // Future drill - not started yet
                    segmentFillPercent = 0;
                  }
                  
                  // Determine segment colors based on segment type (muted for unfilled, saturated for filled)
                  const getMutedBg = () => {
                    if (drill.segment === "Warmup") return "bg-amber-500/20";
                    if (drill.segment === "Cool Down") return "bg-purple-500/20";
                    return "bg-primary/20";
                  };
                  
                  const getSaturatedBg = () => {
                    if (drill.segment === "Warmup") return "bg-amber-500";
                    if (drill.segment === "Cool Down") return "bg-purple-500";
                    return "bg-primary";
                  };
                  
                  const isCurrentDrill = index === currentDrillIndex;
                  const isCompleted = segmentFillPercent === 100;
                  
                  return (
                    <div
                      key={index}
                      className={`relative h-full overflow-hidden ${getMutedBg()} ${
                        index < drillSequence.length - 1 ? "border-r border-background/50" : ""
                      }`}
                      style={{ width: `${drillWidthPercent}%` }}
                      title={`${drill.name} (${drill.duration} min) - ${drill.segment}`}
                    >
                      {/* Filled portion with full saturation */}
                      <div
                        className={`absolute inset-0 h-full transition-all duration-500 ${getSaturatedBg()} ${
                          isCurrentDrill && isRunning ? "animate-pulse" : ""
                        } ${isCompleted ? "shadow-inner" : ""}`}
                        style={{ 
                          width: `${segmentFillPercent}%`,
                          boxShadow: isCompleted 
                            ? `inset 0 1px 2px rgba(255,255,255,0.3)` 
                            : 'none'
                        }}
                      />
                      {/* Leading edge indicator */}
                      {isCurrentDrill && segmentFillPercent > 0 && segmentFillPercent < 100 && (
                        <div 
                          className="absolute top-0 h-full w-1 bg-white/90 shadow-lg"
                          style={{ 
                            left: `${segmentFillPercent}%`,
                            boxShadow: '0 0 8px 2px rgba(255,255,255,0.6)'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span>Warmup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Main</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-purple-500" />
                <span>Cool Down</span>
              </div>
            </div>            
          </div>

          {timerMode === "total" ? (
            <div className="text-center space-y-6">
              <div className="py-6">
                <div
                  className={`text-8xl font-bold tabular-nums drop-shadow-sm ${
                    totalTimeRemaining === 0
                      ? "text-green-600"
                      : totalTimeRemaining < 300
                        ? "text-secondary"
                        : "text-primary"
                  }`}
                >
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
                <p className="text-muted-foreground mt-4 text-lg">
                  {totalTimeRemaining === 0 ? "Practice Complete!" : "Overall time remaining"}
                </p>
                {timeSaved > 0 && totalTimeRemaining > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full px-4 py-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold">
                      {Math.floor(timeSaved / 60)}:{String(timeSaved % 60).padStart(2, "0")} ahead of schedule
                    </span>
                  </div>
                )}
                {timeBehind > 0 && totalTimeRemaining > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-full px-4 py-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">
                      {Math.floor(timeBehind / 60)}:{String(timeBehind % 60).padStart(2, "0")} behind schedule
                    </span>
                  </div>              
                )}                
                {drillSequence.length > 0 && totalTimeRemaining > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Currently on: <span className="font-medium text-foreground">{currentDrill?.name}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-primary">Drill {currentDrillIndex + 1} of {drillSequence.length}</span>
                  </p>
                )}                
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Clock</div>
                <div className="text-5xl font-bold text-primary tabular-nums">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
                <p className="text-sm text-muted-foreground">Practice time remaining</p>
              </div>

              <div className="overflow-hidden">
                <div
                  className={`text-center space-y-2 transition-all duration-300 ease-out ${
                    slideState === "sliding-out"
                      ? "-translate-x-full opacity-0"
                      : slideState === "sliding-in"
                        ? "translate-x-full opacity-0"
                        : "translate-x-0 opacity-100"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
                    Current Drill{drillSequence.length > 0 && ` • ${currentDrillIndex + 1} of ${drillSequence.length}`}
                  </p>
                  <h3 className="text-2xl font-bold text-secondary">
                    {currentDrill?.name || "No drills in this practice"}
                  </h3>
                  {currentDrill?.segment && (
                    <Badge variant="outline" className="border-secondary/30 text-secondary">
                      {currentDrill.segment}
                    </Badge>
                  )}
                </div>
              </div>

             <div className="overflow-hidden">
                <div
                  className={`rounded-2xl border border-secondary/40 bg-secondary/5 p-6 text-center space-y-3 transition-all duration-300 ease-out ${
                    slideState === "sliding-out"
                      ? "-translate-x-full opacity-0"
                      : slideState === "sliding-in"
                        ? "translate-x-full opacity-0"
                        : "translate-x-0 opacity-100"
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-secondary">Drill Timer</p>
                  <div className="text-6xl font-bold tabular-nums text-secondary">
                    {String(drillMinutes).padStart(2, "0")}:{String(drillSeconds).padStart(2, "0")}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {currentDrill
                      ? `${currentDrill.duration} min allocated`
                      : "Add drills to see per-drill timing"}
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={handleNextDrill}
                      disabled={isLastDrill || isAnimating}
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip Drill
                      {drillTimeRemaining > 0 && !isLastDrill && (
                        <span className="text-xs opacity-75">
                          (+{Math.floor(drillTimeRemaining / 60)}:{String(drillTimeRemaining % 60).padStart(2, "0")})
                        </span>
                      )}
                    </Button>
                    {timeSaved > 0 && (
                      <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        {Math.floor(timeSaved / 60)}:{String(timeSaved % 60).padStart(2, "0")} ahead of schedule
                      </p>
                    )}
                    {timeBehind > 0 && (
                      <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.floor(timeBehind / 60)}:{String(timeBehind % 60).padStart(2, "0")} behind schedule
                      </p>                  
                    )}                    
                  </div>                
                </div>   
              </div>
            </div>
          )}

          {totalTimeRemaining === 0 && !showFeedback && (
            <div className="space-y-3 text-center">
              <p className="text-green-700 font-semibold">Great work! Ready to leave feedback?</p>
              <Button size="lg" className="gap-2 px-8" onClick={handleShowFeedback}>
                <CheckCircle2 className="h-5 w-5" />
                Leave Feedback
              </Button>
            </div>
                )}

          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={() => setIsRunning(!isRunning)}
              disabled={totalTimeRemaining === 0}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Start
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setTotalTimeRemaining(totalDurationMinutes * 60);
                setCurrentDrillIndex(0);
                setDrillTimeRemaining((drillSequence[0]?.duration || 0) * 60);
                setIsRunning(false);
                setTimeSaved(0);
                setShowTimeSavedToast(false);
                setSkippedDrillFills(new Map());
                setTimeBehind(0);
                setShowTimeBehindToast(false);
                setCurrentDrillOvertime(0);                  
              }}              
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button variant="outline" size="icon" onClick={handleEndTimer}>
              <Square className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showFeedback && (
        <div ref={feedbackRef}>
          <Card className="border-2 border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Post-Practice Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rating">Rate this practice plan</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-primary">{feedbackRating}</span>
                    <span className="text-muted-foreground">/ 10</span>
                  </div>
                </div>
                <Slider
                  id="rating"
                  value={[feedbackRating]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setFeedbackRating(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Needs Work</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="feedback">Comments (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="E.g., too boring, too intense, great energy, need more variety..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                size="lg"
                className="w-full gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RunPractice;
