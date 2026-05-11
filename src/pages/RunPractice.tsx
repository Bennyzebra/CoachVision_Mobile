import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Star,
  CheckCircle2,
  Save,
  Square,
  Zap,
  PencilLine,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { getPractice, Practice } from "@/services/practiceService";
import { useMobileBottomAction } from "@/components/MobileBottomActionContext";
import { cn } from "@/lib/utils";
import { getPracticeProgressSegments } from "./runPracticeProgress";
type DrillSlideDirection = "next" | "previous";
type DrillSlideTransition = {
  direction: DrillSlideDirection;
  fromIndex: number;
  toIndex: number;
  phase: "ready" | "sliding";
  fromDrillTimeRemaining: number;
  fromDrillOvertime: number;
  fromDetailsOpen: boolean;
};
type OverallEngagement = "low" | "ok" | "high";
type DrillEngagement = "low" | "ok" | "great";
type DrillQuickRating = "down" | "up";
type DrillFeedbackState = {
  quickRating: DrillQuickRating | null;
  engagement: DrillEngagement | null;
  note: string;
};
type PaceNotification = {
  kind: "ahead" | "behind";
  eventSeconds: number;
  netSeconds: number;
  id: number;
};
type PaceAdjustment = {
  savedSeconds: number;
  behindSeconds: number;
};

const overallEngagementOptions: Array<{ value: OverallEngagement; label: string }> = [
  { value: "low", label: "Low" },
  { value: "ok", label: "OK" },
  { value: "high", label: "High" },
];

const drillEngagementOptions: Array<{ value: DrillEngagement; label: string }> = [
  { value: "low", label: "Low" },
  { value: "ok", label: "OK" },
  { value: "great", label: "Great" },
];

const PRACTICE_TITLE_FONT_SIZE_REM = 2;
const DEFAULT_DRILL_TITLE_FONT_SIZE_REM = 2.8;
const TIMER_SYNC_TOLERANCE_MS = 20;
const PACE_NOTIFICATION_DURATION_MS = 3000;
const PACE_NOTIFICATION_EXIT_DURATION_MS = 500;
const DRILL_SLIDE_DURATION_MS = 300;

type DrillTitleFit = {
  fontSizeRem: number;
  shouldWrap: boolean;
};

const calculatePlanDuration = (planDetails: Practice["plan_details"]) => {
  const sumDurations = (drills: Practice["plan_details"][keyof Practice["plan_details"]]) =>
    drills.reduce((total, drill) => total + (Number(drill.duration) || 0), 0);

  return (
    sumDurations(planDetails.warmup) +
    sumDurations(planDetails.main_segment) +
    sumDurations(planDetails.cool_down)
  );
};

const buildDrillSequence = (planDetails: Practice["plan_details"]) => [
  ...planDetails.warmup.map((drill) => ({ ...drill, segment: "Warmup" })),
  ...planDetails.main_segment.map((drill) => ({ ...drill, segment: "Main Segment" })),
  ...planDetails.cool_down.map((drill) => ({ ...drill, segment: "Cool Down" })),
];

const formatTimer = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const formatElapsedClock = (totalMilliseconds: number) => {
  const safeMilliseconds = Math.max(0, Math.floor(totalMilliseconds));
  const minutes = Math.floor(safeMilliseconds / 60000);
  const seconds = Math.floor((safeMilliseconds % 60000) / 1000);
  const centiseconds = Math.floor((safeMilliseconds % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(centiseconds).padStart(2, "0")}`;
};

const formatPracticeDisplayTitle = (practice: Practice) => {
  return practice.title?.trim() || "Practice";
};

const getMeasuredDrillTitleFit = (availableWidthPx: number, measuredWidthPx: number): DrillTitleFit => {
  if (availableWidthPx <= 0 || measuredWidthPx <= 0) {
    return {
      fontSizeRem: DEFAULT_DRILL_TITLE_FONT_SIZE_REM,
      shouldWrap: false,
    };
  }

  const fitRatio = availableWidthPx / measuredWidthPx;
  const fittedFontSizeRem = DEFAULT_DRILL_TITLE_FONT_SIZE_REM * fitRatio;
  const nextFontSizeRem = Math.max(
    PRACTICE_TITLE_FONT_SIZE_REM,
    Math.min(DEFAULT_DRILL_TITLE_FONT_SIZE_REM, fittedFontSizeRem)
  );
  const shouldWrap = nextFontSizeRem <= PRACTICE_TITLE_FONT_SIZE_REM && measuredWidthPx > availableWidthPx;

  return {
    fontSizeRem: Number(nextFontSizeRem.toFixed(2)),
    shouldWrap,
  };
};

const formatSegmentLabel = (segment?: string) => {
  if (segment === "Warmup") return "Warm-up";
  return segment || "Drill";
};

const formatFocusLabel = (focus?: string) => {
  if (!focus) return "Focus";
  return focus
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type FeedbackDrill = ReturnType<typeof buildDrillSequence>[number];
type SegmentedFeedbackDrill = {
  segment: string;
  drills: Array<{ drill: FeedbackDrill; index: number; key: string }>;
};

const getSegmentedFeedbackDrills = (drills: FeedbackDrill[]): SegmentedFeedbackDrill[] => {
  return drills.reduce<SegmentedFeedbackDrill[]>((segments, drill, index) => {
    const key = `${drill.id}-${index}`;
    const currentSegment = segments[segments.length - 1];

    if (!currentSegment || currentSegment.segment !== drill.segment) {
      segments.push({ segment: drill.segment, drills: [{ drill, index, key }] });
      return segments;
    }

    currentSegment.drills.push({ drill, index, key });
    return segments;
  }, []);
};

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
  const { registerMobileBottomAction } = useMobileBottomAction();

  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [elapsedPracticeMilliseconds, setElapsedPracticeMilliseconds] = useState(0);
  const [drillTimeRemaining, setDrillTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isDrillDetailsOpen, setIsDrillDetailsOpen] = useState(false);
  const [isNextPreviewOpen, setIsNextPreviewOpen] = useState(false);
  const [overallStarRating, setOverallStarRating] = useState(4);
  const [overallEngagement, setOverallEngagement] = useState<OverallEngagement | null>("high");
  const [isOverallNoteOpen, setIsOverallNoteOpen] = useState(false);
  const [overallNote, setOverallNote] = useState("");
  const [expandedDrillKey, setExpandedDrillKey] = useState<string | null>(null);
  const [drillFeedbackByKey, setDrillFeedbackByKey] = useState<Record<string, DrillFeedbackState>>({});
  const [drillSlideTransition, setDrillSlideTransition] = useState<DrillSlideTransition | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeSaved, setTimeSaved] = useState(0);
  const [timeBehind, setTimeBehind] = useState(0);
  const [paceNotification, setPaceNotification] = useState<PaceNotification | null>(null);
  const [isPaceNotificationVisible, setIsPaceNotificationVisible] = useState(false);
  const [paceAdjustmentsByDrillIndex, setPaceAdjustmentsByDrillIndex] = useState<Record<number, PaceAdjustment>>({});
  const [selectedProgressSegmentIndex, setSelectedProgressSegmentIndex] = useState<number | null>(null);
  const [currentDrillOvertime, setCurrentDrillOvertime] = useState(0);  
  const [drillTitleFit, setDrillTitleFit] = useState<DrillTitleFit>({
    fontSizeRem: DEFAULT_DRILL_TITLE_FONT_SIZE_REM,
    shouldWrap: false,
  });
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const practiceProgressRef = useRef<HTMLDivElement | null>(null);
  const drillTitleContainerRef = useRef<HTMLDivElement | null>(null);
  const drillTitleMeasureRef = useRef<HTMLSpanElement | null>(null);
  const elapsedPracticeMillisecondsRef = useRef(0);
  const drillTimeRemainingMillisecondsRef = useRef(0);
  const currentDrillOvertimeMillisecondsRef = useRef(0);
  const paceNotificationTimeoutRef = useRef<number | null>(null);
  const paceNotificationDismissTimeoutRef = useRef<number | null>(null);
  const paceNotificationIdRef = useRef(0);
  const drillSlideTimeoutRef = useRef<number | null>(null);
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

  const segmentedFeedbackDrills = useMemo(
    () => getSegmentedFeedbackDrills(drillSequence),
    [drillSequence]
  );
  
  const planDurationMinutes = practice ? calculatePlanDuration(practice.plan_details) : 0;
  const totalDurationMinutes = planDurationMinutes || practice?.duration || 0;
  const totalDurationSeconds = totalDurationMinutes * 60;
  const totalDurationMilliseconds = totalDurationSeconds * 1000;
  const netScheduleSeconds = timeSaved - timeBehind;
  const netScheduleAbsSeconds = Math.abs(netScheduleSeconds);

  const clearPaceNotificationTimeout = useCallback(() => {
    if (paceNotificationTimeoutRef.current !== null) {
      window.clearTimeout(paceNotificationTimeoutRef.current);
      paceNotificationTimeoutRef.current = null;
    }
    if (paceNotificationDismissTimeoutRef.current !== null) {
      window.clearTimeout(paceNotificationDismissTimeoutRef.current);
      paceNotificationDismissTimeoutRef.current = null;
    }
  }, []);

  const clearDrillSlideTimeout = useCallback(() => {
    if (drillSlideTimeoutRef.current === null) return;

    window.clearTimeout(drillSlideTimeoutRef.current);
    drillSlideTimeoutRef.current = null;
  }, []);

  const showPaceNotification = useCallback(
    (eventSeconds: number, nextNetSeconds: number) => {
      clearPaceNotificationTimeout();

      if (nextNetSeconds === 0) {
        setIsPaceNotificationVisible(false);
        setPaceNotification(null);
        return;
      }

      const nextNotification: PaceNotification = {
        kind: nextNetSeconds > 0 ? "ahead" : "behind",
        eventSeconds,
        netSeconds: Math.abs(nextNetSeconds),
        id: paceNotificationIdRef.current + 1,
      };

      paceNotificationIdRef.current = nextNotification.id;
      setPaceNotification(nextNotification);
      setIsPaceNotificationVisible(true);

      paceNotificationTimeoutRef.current = window.setTimeout(() => {
        setIsPaceNotificationVisible(false);
        paceNotificationTimeoutRef.current = null;
      }, PACE_NOTIFICATION_DURATION_MS);

      paceNotificationDismissTimeoutRef.current = window.setTimeout(() => {
        setPaceNotification((current) => (
          current?.id === nextNotification.id ? null : current
        ));
        paceNotificationDismissTimeoutRef.current = null;
      }, PACE_NOTIFICATION_DURATION_MS + PACE_NOTIFICATION_EXIT_DURATION_MS);
    },
    [clearPaceNotificationTimeout]
  );

  useEffect(() => clearPaceNotificationTimeout, [clearPaceNotificationTimeout]);
  useEffect(() => clearDrillSlideTimeout, [clearDrillSlideTimeout]);

  useEffect(() => {
    if (!practice) return;

    const durationToUse = totalDurationMinutes || Number(practice.duration) || 0;
    const firstDrillDuration = drillSequence[0]?.duration || 0;
    const firstDrillDurationMilliseconds = firstDrillDuration * 60 * 1000;

    setTotalTimeRemaining(durationToUse * 60);
    elapsedPracticeMillisecondsRef.current = 0;
    drillTimeRemainingMillisecondsRef.current = firstDrillDurationMilliseconds;
    currentDrillOvertimeMillisecondsRef.current = 0;
    setElapsedPracticeMilliseconds(0);
    setCurrentDrillIndex(0);
    setDrillTimeRemaining(firstDrillDuration * 60);
    setIsDrillDetailsOpen(false);
    setIsNextPreviewOpen(false);
  }, [practice, drillSequence, totalDurationMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    const startedAt = performance.now() - elapsedPracticeMillisecondsRef.current;
    const updateSynchronizedPracticeTimers = () => {
      const nextElapsed = Math.min(
        totalDurationMilliseconds,
        Math.max(0, performance.now() - startedAt)
      );
      const elapsedDeltaMilliseconds = nextElapsed - elapsedPracticeMillisecondsRef.current;

      if (elapsedDeltaMilliseconds < 0) return;

      elapsedPracticeMillisecondsRef.current = nextElapsed;
      setElapsedPracticeMilliseconds(nextElapsed);

      const nextTotalRemainingMilliseconds = Math.max(0, totalDurationMilliseconds - nextElapsed);
      setTotalTimeRemaining(Math.ceil(nextTotalRemainingMilliseconds / 1000));

      if (drillSequence.length > 0) {
        const nextDrillRemainingMilliseconds =
          drillTimeRemainingMillisecondsRef.current - elapsedDeltaMilliseconds;

        if (nextDrillRemainingMilliseconds <= TIMER_SYNC_TOLERANCE_MS) {
          currentDrillOvertimeMillisecondsRef.current += Math.max(0, -nextDrillRemainingMilliseconds);
          drillTimeRemainingMillisecondsRef.current = 0;
          setDrillTimeRemaining(0);
          setCurrentDrillOvertime(Math.floor(currentDrillOvertimeMillisecondsRef.current / 1000));
        } else {
          drillTimeRemainingMillisecondsRef.current = nextDrillRemainingMilliseconds;
          setDrillTimeRemaining(Math.ceil(nextDrillRemainingMilliseconds / 1000));
        }
      }

      if (nextTotalRemainingMilliseconds <= TIMER_SYNC_TOLERANCE_MS) {
        elapsedPracticeMillisecondsRef.current = totalDurationMilliseconds;
        setElapsedPracticeMilliseconds(totalDurationMilliseconds);
        setTotalTimeRemaining(0);
        setIsRunning(false);
      }
    };

    updateSynchronizedPracticeTimers();
    const timer = window.setInterval(updateSynchronizedPracticeTimers, 10);

    return () => window.clearInterval(timer);
  }, [drillSequence.length, isRunning, totalDurationMilliseconds]);

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
    elapsedPracticeMillisecondsRef.current = totalDurationSeconds * 1000;
    drillTimeRemainingMillisecondsRef.current = 0;
    currentDrillOvertimeMillisecondsRef.current = 0;
    setElapsedPracticeMilliseconds(totalDurationSeconds * 1000);
    handleShowFeedback();
    setDrillTimeRemaining(0);    
  };

  const handleToggleTimer = useCallback(() => {
    if (totalTimeRemaining === 0) return;
    setIsRunning((current) => !current);
  }, [totalTimeRemaining]);

  const handleResetPractice = useCallback(() => {
    const firstDrillDurationMilliseconds = (drillSequence[0]?.duration || 0) * 60 * 1000;
    setTotalTimeRemaining(totalDurationMinutes * 60);
    elapsedPracticeMillisecondsRef.current = 0;
    drillTimeRemainingMillisecondsRef.current = firstDrillDurationMilliseconds;
    currentDrillOvertimeMillisecondsRef.current = 0;
    setElapsedPracticeMilliseconds(0);
    setCurrentDrillIndex(0);
    setDrillTimeRemaining(Math.ceil(firstDrillDurationMilliseconds / 1000));
    setIsRunning(false);
    setTimeSaved(0);
    setTimeBehind(0);
    setPaceAdjustmentsByDrillIndex({});
    clearDrillSlideTimeout();
    setDrillSlideTransition(null);
    setIsAnimating(false);
    clearPaceNotificationTimeout();
    setPaceNotification(null);
    setCurrentDrillOvertime(0);
    setIsDrillDetailsOpen(false);
    setIsNextPreviewOpen(false);
  }, [clearDrillSlideTimeout, clearPaceNotificationTimeout, drillSequence, totalDurationMinutes]);

  const updateDrillFeedback = (key: string, updates: Partial<DrillFeedbackState>) => {
    setDrillFeedbackByKey((current) => {
      const previous = current[key] ?? { quickRating: null, engagement: null, note: "" };
      return {
        ...current,
        [key]: {
          ...previous,
          ...updates,
        },
      };
    });
  };

  const handleLocalFeedbackSave = useCallback(() => {
    toast.success("Feedback saved locally for now");
  }, []);

  const handleReturnFromFeedback = useCallback(() => {
    setShowFeedback(false);
  }, []);

  const handleSaveFeedbackAndExit = useCallback(() => {
    handleLocalFeedbackSave();
    navigate("/");
  }, [handleLocalFeedbackSave, navigate]);

  const startDrillSlideTransition = useCallback(
    (direction: DrillSlideDirection, toIndex: number, nextDrillDurationMilliseconds: number) => {
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      clearDrillSlideTimeout();
      setIsAnimating(true);
      setCurrentDrillIndex(toIndex);
      drillTimeRemainingMillisecondsRef.current = nextDrillDurationMilliseconds;
      currentDrillOvertimeMillisecondsRef.current = 0;
      setDrillTimeRemaining(Math.ceil(nextDrillDurationMilliseconds / 1000));
      setCurrentDrillOvertime(0);
      setIsDrillDetailsOpen(false);
      setIsNextPreviewOpen(false);

      if (prefersReducedMotion) {
        setDrillSlideTransition(null);
        setIsAnimating(false);
        return;
      }

      setDrillSlideTransition({
        direction,
        fromIndex: currentDrillIndex,
        toIndex,
        phase: "ready",
        fromDrillTimeRemaining: drillTimeRemaining,
        fromDrillOvertime: currentDrillOvertime,
        fromDetailsOpen: isDrillDetailsOpen,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrillSlideTransition((currentTransition) =>
            currentTransition ? { ...currentTransition, phase: "sliding" } : currentTransition
          );
        });
      });

      drillSlideTimeoutRef.current = window.setTimeout(() => {
        setDrillSlideTransition(null);
        setIsAnimating(false);
        drillSlideTimeoutRef.current = null;
      }, DRILL_SLIDE_DURATION_MS);
    },
    [
      clearDrillSlideTimeout,
      currentDrillIndex,
      currentDrillOvertime,
      drillTimeRemaining,
      isDrillDetailsOpen,
    ]
  );

  const handleNextDrill = useCallback(() => {
    if (drillSequence.length === 0 || isAnimating) return;
    if (currentDrillIndex >= drillSequence.length - 1) {
      setDrillTimeRemaining(0);
      return;
    }

    const timeRemainingOnDrill = Math.ceil(drillTimeRemainingMillisecondsRef.current / 1000);
    const currentDrillOvertimeSeconds = Math.floor(currentDrillOvertimeMillisecondsRef.current / 1000);
    let nextTimeSaved = timeSaved;
    let nextTimeBehind = timeBehind;

    if (timeRemainingOnDrill > 0) {
      nextTimeSaved += timeRemainingOnDrill;
      setTimeSaved(nextTimeSaved);
    }

    if (currentDrillOvertimeSeconds > 0) {
      nextTimeBehind += currentDrillOvertimeSeconds;
      setTimeBehind(nextTimeBehind);
    }

    setPaceAdjustmentsByDrillIndex((current) => ({
      ...current,
      [currentDrillIndex]: {
        savedSeconds: timeRemainingOnDrill,
        behindSeconds: currentDrillOvertimeSeconds,
      },
    }));

    const paceEventSeconds = timeRemainingOnDrill > 0 ? timeRemainingOnDrill : currentDrillOvertimeSeconds;
    if (paceEventSeconds > 0) {
      const nextNetSeconds = nextTimeSaved - nextTimeBehind;
      showPaceNotification(paceEventSeconds, nextNetSeconds);
    }   

    const nextIndex = currentDrillIndex + 1;
    const nextDrillDurationMilliseconds = (drillSequence[nextIndex]?.duration || 0) * 60 * 1000;
    startDrillSlideTransition("next", nextIndex, nextDrillDurationMilliseconds);
  }, [
    currentDrillIndex,
    drillSequence,
    isAnimating,
    showPaceNotification,
    startDrillSlideTransition,
    timeBehind,
    timeSaved,
  ]);

  const handlePreviousDrill = useCallback(() => {
    if (drillSequence.length === 0 || isAnimating || currentDrillIndex <= 0) return;

    const previousIndex = currentDrillIndex - 1;
    const previousDrillDurationMilliseconds = (drillSequence[previousIndex]?.duration || 0) * 60 * 1000;
    const adjustmentToReverse = paceAdjustmentsByDrillIndex[previousIndex];

    if (adjustmentToReverse) {
      const nextTimeSaved = Math.max(0, timeSaved - adjustmentToReverse.savedSeconds);
      const nextTimeBehind = Math.max(0, timeBehind - adjustmentToReverse.behindSeconds);
      const nextNetSeconds = nextTimeSaved - nextTimeBehind;

      setTimeSaved(nextTimeSaved);
      setTimeBehind(nextTimeBehind);
      setPaceAdjustmentsByDrillIndex((current) => {
        const nextAdjustments = { ...current };
        delete nextAdjustments[previousIndex];
        return nextAdjustments;
      });
      showPaceNotification(
        adjustmentToReverse.savedSeconds || adjustmentToReverse.behindSeconds,
        nextNetSeconds
      );
    }

    startDrillSlideTransition("previous", previousIndex, previousDrillDurationMilliseconds);
  }, [
    currentDrillIndex,
    drillSequence,
    isAnimating,
    paceAdjustmentsByDrillIndex,
    showPaceNotification,
    startDrillSlideTransition,
    timeBehind,
    timeSaved,
  ]);

  const practiceProgress = totalDurationMilliseconds
    ? Math.max(0, Math.min(100, (elapsedPracticeMilliseconds / totalDurationMilliseconds) * 100))
    : 0;
  const progressSegments = useMemo(
    () =>
      getPracticeProgressSegments({
        drillSequence,
        elapsedPracticeMilliseconds,
        totalDurationMilliseconds,
        currentDrillIndex,
      }),
    [currentDrillIndex, drillSequence, elapsedPracticeMilliseconds, totalDurationMilliseconds]
  );
  const selectedProgressSegment = selectedProgressSegmentIndex === null ? null : progressSegments[selectedProgressSegmentIndex];
  const selectedProgressSegmentLabelPositionPercent = selectedProgressSegment
    ? selectedProgressSegment.startPercent + selectedProgressSegment.widthPercent / 2
    : 0;
  const isFirstSelectedProgressSegment = selectedProgressSegmentIndex === 0;
  const isLastSelectedProgressSegment = selectedProgressSegmentIndex === progressSegments.length - 1;
  const currentDrill = drillSequence[currentDrillIndex];
  const nextDrill = drillSequence[currentDrillIndex + 1];
  const isCurrentDrillFinished = Boolean(currentDrill) && drillTimeRemaining === 0;
  const hasNextDrill = currentDrillIndex < drillSequence.length - 1;
  const finishedDrillActionLabel = hasNextDrill ? "Next drill" : "Finish practice";
  const currentDrillName = currentDrill?.name || "No drills in this practice";
  const isLastDrill =
    drillSequence.length === 0 || currentDrillIndex >= drillSequence.length - 1;
  const practiceDisplayTitle = practice ? formatPracticeDisplayTitle(practice) : "Practice";
  const totalDurationLabel = `${totalDurationMinutes} min`;
  const elapsedPracticeClock = formatElapsedClock(elapsedPracticeMilliseconds);
  const drillRemainingLabel = `${formatTimer(drillTimeRemaining)} remaining`;
  const currentDrillFocusLabel = formatFocusLabel(currentDrill?.focus);
  const nextDrillFocusLabel = formatFocusLabel(nextDrill?.focus);
  const isRunContentScrollable = showFeedback || isDrillDetailsOpen || isNextPreviewOpen;

  const fitDrillTitleToAvailableWidth = useCallback(() => {
    const containerElement = drillTitleContainerRef.current;
    const measureElement = drillTitleMeasureRef.current;

    if (!containerElement || !measureElement) {
      return;
    }

    const availableWidthPx = containerElement.clientWidth;
    measureElement.style.fontSize = `${DEFAULT_DRILL_TITLE_FONT_SIZE_REM}rem`;
    const measuredWidthPx = measureElement.scrollWidth;
    const nextFit = getMeasuredDrillTitleFit(availableWidthPx, measuredWidthPx);

    setDrillTitleFit((currentFit) =>
      currentFit.fontSizeRem === nextFit.fontSizeRem && currentFit.shouldWrap === nextFit.shouldWrap
        ? currentFit
        : nextFit
    );
  }, []);

  useLayoutEffect(() => {
    fitDrillTitleToAvailableWidth();

    const containerElement = drillTitleContainerRef.current;
    if (!containerElement) {
      return;
    }

    let isMounted = true;
    const resizeObserver = new ResizeObserver(fitDrillTitleToAvailableWidth);
    resizeObserver.observe(containerElement);
    document.fonts?.ready.then(() => {
      if (isMounted) {
        fitDrillTitleToAvailableWidth();
      }
    });

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
    };
  }, [currentDrillName, drillSlideTransition, fitDrillTitleToAvailableWidth]);

  useEffect(() => {
    if (loading || !practice) {
      return registerMobileBottomAction(null);
    }

    if (showFeedback) {
      return registerMobileBottomAction({
        variant: "segmented",
        active: true,
        activeSegmentIndex: 1,
        swipeEnabled: false,
        segments: [
          {
            id: "feedback-return",
            label: "Return",
            compactLabel: "Return",
            icon: <ChevronLeft className="h-5 w-5" />,
            onClick: handleReturnFromFeedback,
          },
          {
            id: "feedback-save",
            label: "Save",
            compactLabel: "Save",
            icon: <Save className="h-5 w-5" />,
            primary: true,
            onClick: handleSaveFeedbackAndExit,
          },
        ],
      });
    }

    const pauseResumeLabel = isRunning ? "Pause" : "Start";

    return registerMobileBottomAction({
      variant: "segmented",
      active: true,
      activeSegmentIndex: 1,
      swipeEnabled: totalTimeRemaining > 0 && !isAnimating,
      onSwipeLeftToRight: handleNextDrill,
      onSwipeRightToLeft: handlePreviousDrill,
      segments: [
        {
          id: "previous-drill",
          label: "Previous",
          compactLabel: "Prev",
          icon: <ChevronLeft className="h-5 w-5" />,
          disabled: currentDrillIndex === 0 || totalTimeRemaining === 0 || isAnimating,
          onClick: handlePreviousDrill,
        },
        {
          id: "timer-toggle",
          label: pauseResumeLabel,
          compactLabel: pauseResumeLabel,
          icon: isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />,
          primary: true,
          disabled: totalTimeRemaining === 0,
          onClick: handleToggleTimer,
        },
        {
          id: "next-drill",
          label: "Next",
          compactLabel: "Next",
          icon: <ChevronRight className="h-5 w-5" />,
          disabled: isLastDrill || totalTimeRemaining === 0 || isAnimating,
          onClick: handleNextDrill,
        },
      ],
    });
  }, [
    currentDrillIndex,
    handleNextDrill,
    handlePreviousDrill,
    handleReturnFromFeedback,
    handleSaveFeedbackAndExit,
    handleToggleTimer,
    isAnimating,
    isLastDrill,
    isRunning,
    loading,
    practice,
    registerMobileBottomAction,
    showFeedback,
    totalTimeRemaining,
  ]);

  useEffect(() => {
    if (selectedProgressSegmentIndex === null) return;

    const handleOutsideProgressPointerDown = (event: PointerEvent) => {
      if (
        practiceProgressRef.current &&
        practiceProgressRef.current.contains(event.target as Node)
      ) {
        return;
      }

      setSelectedProgressSegmentIndex(null);
    };

    document.addEventListener("pointerdown", handleOutsideProgressPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideProgressPointerDown);
    };
  }, [selectedProgressSegmentIndex]);

  const renderLiveDrillCard = (
    drillIndex: number,
    isActiveCard = true,
    detailsOpen = isDrillDetailsOpen
  ) => {
    const drill = drillSequence[drillIndex];
    const drillName = drill?.name || "No drills in this practice";
    const drillFocusLabel = formatFocusLabel(drill?.focus);
    const displayedDrillTimeRemaining = isActiveCard
      ? drillTimeRemaining
      : drillSlideTransition?.fromDrillTimeRemaining ?? drillTimeRemaining;
    const displayedCurrentDrillOvertime = isActiveCard
      ? currentDrillOvertime
      : drillSlideTransition?.fromDrillOvertime ?? currentDrillOvertime;
    const shouldShowFinishedDrillAction = isActiveCard && isCurrentDrillFinished && !showFeedback;

    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div ref={isActiveCard ? drillTitleContainerRef : undefined} className="relative min-w-0 flex-1">
            <h2
              className={cn(
                "font-bold leading-[1.05] tracking-normal transition-[font-size]",
                drillTitleFit.shouldWrap ? "line-clamp-2 whitespace-normal" : "whitespace-nowrap"
              )}
              style={{ fontSize: `${drillTitleFit.fontSizeRem}rem` }}
            >
              {drillName}
            </h2>
            <span
              ref={isActiveCard ? drillTitleMeasureRef : undefined}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 -z-10 whitespace-nowrap font-bold leading-[1.05] tracking-normal opacity-0"
              style={{ fontSize: `${DEFAULT_DRILL_TITLE_FONT_SIZE_REM}rem` }}
            >
              {drillName}
            </span>
          </div>
          <button
            type="button"
            className="mt-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => isActiveCard && setIsDrillDetailsOpen((open) => !open)}
            aria-label={detailsOpen ? "Collapse drill details" : "Expand drill details"}
            tabIndex={isActiveCard ? 0 : -1}
          >
            {detailsOpen ? <ChevronUp className="h-7 w-7" /> : <ChevronDown className="h-7 w-7" />}
          </button>
        </div>
        <div className="mt-5 flex w-full max-w-full touch-pan-x flex-nowrap overflow-x-auto overscroll-x-contain items-center gap-2 pb-1 pr-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {drill?.segment && (
            <Badge variant="outline" className="h-8 shrink-0 border-border bg-muted/35 px-3 py-0 text-[1.05rem] font-medium leading-none text-muted-foreground">
              {formatSegmentLabel(drill.segment)}
            </Badge>
          )}
          {drillSequence.length > 0 && (
            <Badge variant="outline" className="h-8 shrink-0 border-border bg-muted/35 px-3 py-0 text-[1.05rem] font-medium leading-none text-muted-foreground">
              {drillIndex + 1} of {drillSequence.length}
            </Badge>
          )}
          {drill?.focus && (
            <Badge variant="outline" className="h-8 shrink-0 border-primary/50 bg-primary/10 px-3 py-0 text-[1.05rem] font-medium leading-none text-primary">
              {drillFocusLabel}
            </Badge>
          )}
        </div>

        <div className="mt-6">
          <div className="flex w-full flex-wrap items-baseline gap-2 overflow-visible">
            <span className="shrink-0 text-[3.825rem] font-bold leading-none tracking-normal tabular-nums">
              {formatTimer(displayedDrillTimeRemaining)}
            </span>
            <span className="shrink-0 pb-2 text-[1.35rem] font-medium text-muted-foreground">remaining</span>
            {shouldShowFinishedDrillAction && (
              <Button
                type="button"
                size="sm"
                className="mb-2 ml-1 h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-semibold"
                onClick={() => hasNextDrill ? handleNextDrill() : handleEndTimer()}
                disabled={isAnimating || drillSequence.length === 0}
                aria-label={finishedDrillActionLabel}
              >
                {finishedDrillActionLabel}
                {hasNextDrill ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
          <p className="sr-only">{drillRemainingLabel}</p>
          {displayedCurrentDrillOvertime > 0 && (
            <p className="mt-1 inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500">
              {formatTimer(displayedCurrentDrillOvertime)} overtime
            </p>
          )}
        </div>

        {detailsOpen && drill && (
          <div className="mt-6 space-y-3 rounded-[8px] border border-border bg-card/80 px-4 py-4 text-base leading-7 text-muted-foreground">
            {drill.description && <p>{drill.description}</p>}
            {drill.explainWhy && (
              <p>
                <span className="font-medium text-foreground">Why:</span> {drill.explainWhy}
              </p>
            )}
            {drill.cues && drill.cues.length > 0 && (
              <div>
                <p className="mb-1 font-medium text-foreground">Cues</p>
                <ul className="space-y-1">
                  {drill.cues.map((cue, index) => (
                    <li key={`${cue}-${index}`} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {drill.tags && drill.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {drill.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border bg-muted/35 px-2 py-0 text-[11px] font-medium text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {drill.mediaUrl && (
              <a
                href={drill.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
              >
                View drill resource
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  const drillCardBaseClassName =
    "col-start-1 row-start-1 min-w-0 translate-x-0 transition-transform duration-300 ease-out motion-reduce:transition-none";
  const outgoingDrillCardClassName = cn(
    drillCardBaseClassName,
    "pointer-events-none",
    drillSlideTransition &&
      drillSlideTransition.phase === "sliding" &&
      drillSlideTransition.direction === "next" && "-translate-x-full",
    drillSlideTransition &&
      drillSlideTransition.phase === "sliding" &&
      drillSlideTransition.direction === "previous" && "translate-x-full"
  );
  const incomingDrillCardClassName = cn(
    drillCardBaseClassName,
    drillSlideTransition &&
      drillSlideTransition.phase === "ready" &&
      drillSlideTransition.direction === "next" && "translate-x-full",
    drillSlideTransition &&
      drillSlideTransition.phase === "ready" &&
      drillSlideTransition.direction === "previous" && "-translate-x-full",
    drillSlideTransition && drillSlideTransition.phase === "sliding" && "translate-x-0"
  );
  const activeDrillCardKey = `active-${currentDrillIndex}`;

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


  return (
    <div
      className={cn(
        "mx-auto h-[calc(100dvh-var(--app-safe-area-top)-4.75rem-var(--app-safe-area-bottom))] w-full max-w-md overflow-x-hidden overscroll-x-none scrollbar-none text-foreground",
        isRunContentScrollable ? "overflow-y-auto pb-2" : "overflow-hidden pb-0",
        showFeedback && "touch-pan-y"
      )}
    >
      {paceNotification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
            isPaceNotificationVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-white shadow-sm",
              paceNotification.kind === "ahead"
                ? "border-green-500/40 bg-green-600"
                : "border-red-500/40 bg-red-600"
            )}
          >
            {paceNotification.kind === "ahead" ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <div className="text-center">
              <p className="text-sm font-semibold">
                {paceNotification.kind === "ahead" ? "Ahead of schedule" : "Behind schedule"}
              </p>
              <p
                className={cn(
                  "text-xs",
                  paceNotification.kind === "ahead" ? "text-green-100" : "text-red-100"
                )}
              >
                You're now {formatTimer(paceNotification.netSeconds)}{" "}
                {paceNotification.kind === "ahead" ? "ahead" : "behind"} of schedule
              </p>
            </div>
          </div>
        </div>
      )}

      <section>
        <div>
          <div className="relative mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/70 pb-1 pt-4">
            <button
              type="button"
              className="absolute -top-8 left-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/35 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="min-w-0 truncate text-[2rem] font-bold leading-tight tracking-normal">
              {practiceDisplayTitle}
            </h1>
            <span className="text-[1.55rem] font-semibold leading-none text-muted-foreground">
              {totalDurationLabel}
            </span>
          </div>

          <div ref={practiceProgressRef} className="relative">
            <div
              className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted/70"
              aria-label={`Practice ${Math.round(practiceProgress)}% complete`}
            >
              <div className="flex h-full w-full">
                {drillSequence.length > 0 ? (
                  progressSegments.map((progressSegment, index) => {
                      const mutedClass =
                        progressSegment.segment === "Warmup"
                          ? "bg-secondary/20"
                          : progressSegment.segment === "Cool Down"
                            ? "bg-foreground/15"
                            : "bg-primary/20";
                      const fillClass =
                        progressSegment.segment === "Warmup"
                          ? "bg-secondary"
                          : progressSegment.segment === "Cool Down"
                            ? "bg-foreground/55"
                            : "bg-primary";

                      return (
                        <button
                          key={index}
                          type="button"
                          aria-current={progressSegment.isActive ? "step" : undefined}
                          aria-label={`Show drill ${progressSegment.name || "Drill"}`}
                          aria-pressed={selectedProgressSegmentIndex === index}
                          className={cn(
                            "relative h-full overflow-hidden border-0 p-0 text-left",
                            mutedClass,
                            progressSegment.isActive && "ring-2 ring-inset ring-primary/80",
                            index < drillSequence.length - 1 && "border-r border-background/80"
                          )}
                          onClick={() =>
                            setSelectedProgressSegmentIndex((currentIndex) => (currentIndex === index ? null : index))
                          }
                          style={{ width: `${progressSegment.widthPercent}%` }}
                          title={`${progressSegment.name} (${progressSegment.duration} min) - ${progressSegment.segment}`}
                        >
                          <div
                            className={cn("h-full transition-all duration-500", fillClass)}
                            style={{ width: `${progressSegment.fillPercent}%` }}
                          />
                        </button>
                      );
                    })
                ) : (
                  <div className="h-full bg-primary" style={{ width: `${practiceProgress}%` }} />
                )}
              </div>
            </div>
            {selectedProgressSegment?.name && (
              <p
                className={cn(
                  "absolute top-full mt-2 flex max-w-[min(18rem,100%)] items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground",
                  isFirstSelectedProgressSegment ? "left-0" : isLastSelectedProgressSegment ? "right-0" : "-translate-x-1/2"
                )}
                style={isFirstSelectedProgressSegment || isLastSelectedProgressSegment
                  ? undefined
                  : { left: `${selectedProgressSegmentLabelPositionPercent}%` }}
              >
                <span className="min-w-0 truncate">{selectedProgressSegment.name}</span>
                <span aria-hidden="true" className="shrink-0 text-muted-foreground/70">•</span>
                <span className="shrink-0">{selectedProgressSegment.duration} min</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-11 overflow-hidden border-b border-border/70 pb-10">
          <div className="grid overflow-hidden">
            {drillSlideTransition ? (
              <>
                <div
                  key={`outgoing-${drillSlideTransition.fromIndex}-${drillSlideTransition.toIndex}-${drillSlideTransition.direction}`}
                  className={outgoingDrillCardClassName}
                >
                  {renderLiveDrillCard(
                    drillSlideTransition.fromIndex,
                    false,
                    drillSlideTransition.fromDetailsOpen
                  )}
                </div>
                <div key={activeDrillCardKey} className={incomingDrillCardClassName}>
                  {renderLiveDrillCard(drillSlideTransition.toIndex)}
                </div>
              </>
            ) : (
              <div key={activeDrillCardKey} className={incomingDrillCardClassName}>
                {renderLiveDrillCard(currentDrillIndex)}
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-border/70">
          <button
            type="button"
            className="flex min-h-[6rem] w-full items-center justify-between gap-3 py-6 text-left disabled:cursor-default disabled:opacity-70"
            onClick={() => nextDrill && setIsNextPreviewOpen((open) => !open)}
            disabled={!nextDrill}
          >
            <span className="min-w-0 flex-1 truncate text-[1.55rem] leading-[1.2] text-muted-foreground">
              <span className="font-medium text-foreground">Next:</span>{" "}
              {nextDrill?.name || "Practice complete"}
            </span>
            {nextDrill && (
              <ChevronDown
                className={cn(
                  "h-7 w-7 shrink-0 text-muted-foreground transition-transform",
                  isNextPreviewOpen && "rotate-180"
                )}
              />
            )}
          </button>
          {isNextPreviewOpen && nextDrill && (
            <div className="space-y-3 pb-5 text-base text-muted-foreground">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-border bg-muted/35 px-2 py-0 text-[11px] font-medium text-muted-foreground">
                  {formatSegmentLabel(nextDrill.segment)}
                </Badge>
                {nextDrill.focus && (
                  <Badge variant="outline" className="border-primary/35 bg-primary/10 px-2 py-0 text-[11px] font-medium text-primary">
                    {nextDrillFocusLabel}
                  </Badge>
                )}
                <Badge variant="outline" className="border-border bg-muted/35 px-2 py-0 text-[11px] font-medium text-muted-foreground">
                  {nextDrill.duration} min
                </Badge>
              </div>
              {nextDrill.description && <p className="line-clamp-2 leading-6">{nextDrill.description}</p>}
            </div>
          )}
        </div>

        <div className="space-y-3 pb-3 pt-5">
          <div className="grid min-h-[7rem] grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted/35 text-muted-foreground">
              <Clock className="h-7 w-7" />
            </span>
            <span className="inline-flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[2.3rem] font-bold leading-none tabular-nums">
                {elapsedPracticeClock}
              </span>
              <span className="text-[1.25rem] font-medium text-muted-foreground">/ {totalDurationLabel}</span>
            </span>
          </div>

          <div className="flex min-h-11 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2 text-xs font-medium">
              {netScheduleSeconds !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
                    netScheduleSeconds > 0
                      ? "border-green-500/30 bg-green-500/10 text-green-500"
                      : "border-red-500/30 bg-red-500/10 text-red-500"
                  )}
                >
                  {netScheduleSeconds > 0 ? (
                    <Zap className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {formatTimer(netScheduleAbsSeconds)} {netScheduleSeconds > 0 ? "ahead" : "behind"}
                </span>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-5">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-full px-0 text-[1.15rem] font-medium text-muted-foreground hover:bg-transparent"
                onClick={handleResetPractice}
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-full px-0 text-[1.15rem] font-medium text-muted-foreground hover:bg-transparent"
                onClick={handleEndTimer}
              >
                <Square className="h-5 w-5" />
                End
              </Button>
            </div>
          </div>
        </div>

        {totalTimeRemaining === 0 && !showFeedback && (
          <div className="space-y-3 border-t border-border/70 pt-4 text-center">
            <p className="text-sm font-semibold text-green-500">Practice complete. Ready for feedback?</p>
            <Button size="lg" className="h-12 w-full gap-2 rounded-[8px]" onClick={handleShowFeedback}>
              <CheckCircle2 className="h-5 w-5" />
              Leave Feedback
            </Button>
          </div>
        )}
      </section>

      {showFeedback && (
          <div
            ref={feedbackRef}
            className="w-full max-w-full overflow-x-hidden overscroll-x-none touch-pan-y pb-[env(safe-area-inset-bottom)]"
          >
          <section className="w-full max-w-full overflow-hidden bg-background text-foreground">
            <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-7 md:px-8">
              <div className="space-y-5">
                <h2 className="whitespace-nowrap text-[2.05rem] font-bold leading-[1.05] tracking-normal text-foreground sm:text-[2.35rem]">
                  How was practice?
                </h2>
                <div className="h-px w-full bg-border" />
              </div>

              <div className="space-y-4">
                <p className="text-[1.05rem] text-muted-foreground">Overall</p>
                <div className="flex items-center gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const isFilled = rating <= overallStarRating;
                    return (
                      <button
                        key={rating}
                        type="button"
                        className="inline-flex bg-transparent p-0 leading-none transition focus-visible:outline-none"
                        onClick={() => setOverallStarRating(rating)}
                        aria-label={`Rate practice ${rating} star${rating === 1 ? "" : "s"}`}
                      >
                        <Star
                          className={`h-10 w-10 transition sm:h-12 sm:w-12 ${
                            isFilled
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/45"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[1.05rem] text-muted-foreground">Engagement</p>
                <div className="grid grid-cols-3 gap-3">
                  {overallEngagementOptions.map((option) => {
                    const isSelected = overallEngagement === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`h-12 rounded-full border px-4 text-base font-medium transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                        onClick={() => setOverallEngagement(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                {isOverallNoteOpen ? (
                  <Textarea
                    value={overallNote}
                    onChange={(event) => setOverallNote(event.target.value)}
                    placeholder="Add note"
                    autoFocus
                    className="min-h-28 resize-none rounded-[8px] border-border bg-card px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                ) : (
                  <button
                    type="button"
                    className="flex min-h-16 w-full items-center gap-3 rounded-[8px] border border-border bg-card px-4 text-left text-primary transition hover:border-primary/60 hover:bg-muted/60"
                    onClick={() => setIsOverallNoteOpen(true)}
                  >
                    <PencilLine className="h-5 w-5" />
                    <span className="text-base font-semibold">Add note</span>
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {segmentedFeedbackDrills.map((segment) => (
                  <section key={segment.segment} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {segment.segment}
                    </h3>
                    <div className="space-y-3">
                      {segment.drills.map(({ drill, key }) => {
                        const feedback = drillFeedbackByKey[key] ?? {
                          quickRating: null,
                          engagement: null,
                          note: "",
                        };
                        const isExpanded = expandedDrillKey === key;

                        return (
                          <article
                            key={key}
                            className={`overflow-hidden rounded-[8px] border bg-card transition ${
                              isExpanded
                                ? "border-primary"
                                : "border-border"
                            }`}
                          >
                            <div className="flex min-h-[4.75rem] items-center gap-2 px-3 py-3">
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left focus-visible:outline-none"
                                onClick={() => setExpandedDrillKey(isExpanded ? null : key)}
                              >
                                <h4 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                                  {drill.name}
                                </h4>
                              </button>

                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                                    feedback.quickRating === "down"
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-card text-muted-foreground"
                                  }`}
                                  onClick={() =>
                                    updateDrillFeedback(key, {
                                      quickRating: feedback.quickRating === "down" ? null : "down",
                                    })
                                  }
                                  aria-label={`Rate ${drill.name} down`}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                                    feedback.quickRating === "up"
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-card text-muted-foreground"
                                  }`}
                                  onClick={() =>
                                    updateDrillFeedback(key, {
                                      quickRating: feedback.quickRating === "up" ? null : "up",
                                    })
                                  }
                                  aria-label={`Rate ${drill.name} up`}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  onClick={() => setExpandedDrillKey(isExpanded ? null : key)}
                                  aria-label={isExpanded ? `Collapse ${drill.name}` : `Expand ${drill.name}`}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-5 border-t border-border px-4 pb-5 pt-5">
                                <div className="space-y-3">
                                  <p className="text-[1.05rem] text-muted-foreground">Engagement</p>
                                  <div className="grid grid-cols-3 gap-3">
                                    {drillEngagementOptions.map((option) => {
                                      const isSelected = feedback.engagement === option.value;
                                      return (
                                        <button
                                          key={option.value}
                                          type="button"
                                          className={`h-10 rounded-full border px-3 text-base font-medium transition ${
                                            isSelected
                                              ? "border-primary bg-primary/10 text-primary"
                                              : "border-border bg-card text-muted-foreground"
                                          }`}
                                          onClick={() =>
                                            updateDrillFeedback(key, {
                                              engagement: option.value,
                                            })
                                          }
                                        >
                                          {option.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <Textarea
                                  value={feedback.note}
                                  onChange={(event) =>
                                    updateDrillFeedback(key, {
                                      note: event.target.value,
                                    })
                                  }
                                  placeholder="add feedback"
                                  className="min-h-24 resize-none rounded-[8px] border-border bg-card px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                />
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <div className="hidden grid-cols-2 gap-3 md:grid">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-[8px] text-base font-semibold"
                  onClick={handleReturnFromFeedback}
                >
                  Return
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="h-14 rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
                  onClick={handleSaveFeedbackAndExit}
                >
                  Save
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default RunPractice;
