import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Library, Loader2, Play, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMobileBottomAction } from "@/components/MobileBottomActionContext";
import type { MobileBottomSegmentedAction } from "@/components/MobileBottomActionContext";
import { useMobilePager } from "@/components/MobilePagerContext";
import { getMobileBottomBarState } from "@/components/mobileBottomBarState";
import { cn } from "@/lib/utils";

type RouteMotionDirection = "left" | "right";
type SegmentedSwipeIntent = "idle" | "horizontal" | "vertical";
type SearchBarProps = {
  placement?: "default" | "mobile-bottom";
};

const MOBILE_CONTROL_MOTION = "420ms cubic-bezier(0.22, 1, 0.36, 1)";
const MOBILE_ROUTE_LABEL_MOTION_MS = 300;
const SEGMENTED_SWIPE_DEADZONE_PX = 8;
const SEGMENTED_SWIPE_HORIZONTAL_INTENT_BIAS_PX = 6;
const SEGMENTED_SWIPE_THRESHOLD_PX = 56;
const SEGMENTED_SWIPE_COMMIT_MS = 180;
const SEGMENTED_CONTENT_MOTION_MS = 150;

const emitRouteMotion = (direction: RouteMotionDirection) => {
  window.dispatchEvent(
    new CustomEvent("coachvision:route-motion", {
      detail: { direction },
    })
  );
};

type AnimatedRouteLabelProps = {
  label: string;
  className?: string;
};

const AnimatedRouteLabel = ({ label, className }: AnimatedRouteLabelProps) => {
  const [displayLabel, setDisplayLabel] = useState(label);
  const [incomingLabel, setIncomingLabel] = useState(label);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const visibleLabelRef = useRef(label);
  const transitionFrameRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (label === visibleLabelRef.current) return;

    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const previousLabel = visibleLabelRef.current;
    visibleLabelRef.current = label;

    setDisplayLabel(previousLabel);
    setIncomingLabel(label);
    setIsTransitioning(false);

    transitionFrameRef.current = window.requestAnimationFrame(() => {
      setIsTransitioning(true);
    });

    transitionTimerRef.current = window.setTimeout(() => {
      setDisplayLabel(label);
      setIsTransitioning(false);
    }, MOBILE_ROUTE_LABEL_MOTION_MS);

    return () => {
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current);
        transitionFrameRef.current = null;
      }
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [label]);

  const isAnimating = displayLabel !== incomingLabel || isTransitioning;

  return (
    <div
      className={cn(
        "relative flex h-10 min-w-0 flex-1 items-center justify-center overflow-hidden text-center text-[15px] font-medium text-foreground",
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center px-1 transition-all duration-300 ease-out motion-reduce:transition-none",
          isAnimating ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        {displayLabel}
      </span>
      <span
        aria-hidden={!isAnimating}
        className={cn(
          "absolute inset-0 flex items-center justify-center px-1 transition-all duration-300 ease-out motion-reduce:transition-none",
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        )}
      >
        {incomingLabel}
      </span>
    </div>
  );
};

type SegmentContent = {
  label: string;
  icon?: ReactNode;
};

type AnimatedSegmentContentProps = {
  segment: MobileBottomSegmentedAction;
  iconAfterLabel?: boolean;
};

const renderSegmentContent = (content: SegmentContent, iconAfterLabel: boolean) => {
  const label = (
    <span className="min-w-0 truncate whitespace-nowrap">
      {content.label}
    </span>
  );

  if (iconAfterLabel) {
    return (
      <>
        {label}
        {content.icon}
      </>
    );
  }

  return (
    <>
      {content.icon}
      {label}
    </>
  );
};

const AnimatedSegmentContent = ({ segment, iconAfterLabel = false }: AnimatedSegmentContentProps) => {
  const label = segment.compactLabel ?? segment.label;
  const [displayContent, setDisplayContent] = useState<SegmentContent>({ label, icon: segment.icon });
  const [incomingContent, setIncomingContent] = useState<SegmentContent>({ label, icon: segment.icon });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const visibleContentRef = useRef<SegmentContent>({ label, icon: segment.icon });
  const transitionFrameRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const nextContent = { label, icon: segment.icon };

    if (label === visibleContentRef.current.label) {
      visibleContentRef.current = nextContent;
      setDisplayContent(nextContent);
      setIncomingContent(nextContent);
      return;
    }

    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const previousContent = visibleContentRef.current;
    visibleContentRef.current = nextContent;
    setDisplayContent(previousContent);
    setIncomingContent(nextContent);
    setIsTransitioning(false);

    transitionFrameRef.current = window.requestAnimationFrame(() => {
      setIsTransitioning(true);
    });

    transitionTimerRef.current = window.setTimeout(() => {
      setDisplayContent(nextContent);
      setIsTransitioning(false);
    }, SEGMENTED_CONTENT_MOTION_MS);

    return () => {
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current);
        transitionFrameRef.current = null;
      }
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [label, segment.icon]);

  const isAnimating = displayContent.label !== incomingContent.label || isTransitioning;

  return (
    <span className="relative flex h-6 min-w-0 flex-1 items-center justify-center overflow-hidden">
      <span
        key={displayContent.label}
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 transition-all duration-150 ease-out group-active:scale-95 motion-reduce:transition-none",
          isAnimating ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        {renderSegmentContent(displayContent, iconAfterLabel)}
      </span>
      <span
        key={segment.compactLabel ?? segment.label}
        aria-hidden={!isAnimating}
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 transition-all duration-150 ease-out group-active:scale-95 motion-reduce:transition-none",
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        )}
      >
        {renderSegmentContent(incomingContent, iconAfterLabel)}
      </span>
    </span>
  );
};

export const SearchBar = ({ placement = "default" }: SearchBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobilePager = useMobilePager();
  const { action: mobileBottomAction } = useMobileBottomAction();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerResizeObserverRef = useRef<ResizeObserver | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [mobilePagerDragOffset, setMobilePagerDragOffset] = useState<number | null>(null);
  const [generatedPlanNavExpanded, setGeneratedPlanNavExpanded] = useState(false);
  const [segmentedSwipeDeltaX, setSegmentedSwipeDeltaX] = useState(0);
  const [segmentedSwipeTargetIndex, setSegmentedSwipeTargetIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const suppressClickRef = useRef(false);
  const hasPointerCaptureRef = useRef(false);
  const mobilePagerStartOffsetRef = useRef(0);
  const segmentedSwipeStartXRef = useRef<number | null>(null);
  const segmentedSwipeStartYRef = useRef(0);
  const segmentedSwipeLatestDeltaXRef = useRef(0);
  const segmentedSwipeIntentRef = useRef<SegmentedSwipeIntent>("idle");
  const segmentedSwipeTimerRef = useRef<number | null>(null);

  const mobileBottomBarState = getMobileBottomBarState(location.pathname);
  const isAutoPlanActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/plan") ||
    location.pathname.startsWith("/run");
  const isLibraryActive =
    location.pathname === "/drills" ||
    location.pathname.startsWith("/drill") ||
    location.pathname.startsWith("/discover");

  const getStatusLabel = (pathname: string) => {
    if (pathname === "/") {
      return "Practice Plan";
    }
    if (pathname.startsWith("/plan")) {
      return "Practice Plan";
    }
    if (pathname.startsWith("/run")) {
      return "Run Practice";
    }
    if (pathname.startsWith("/drill")) {
      return "Drills";
    }
    if (pathname.startsWith("/discover") || pathname.startsWith("/drills")) {
      return "Discover Drills";
    }
    if (pathname.startsWith("/team")) {
      return "Team & Roster";
    }
    if (pathname.startsWith("/settings")) {
      return "Settings";
    }
    if (pathname.startsWith("/practice-tracker")) {
      return "Practice History";
    }    
    if (pathname.startsWith("/submit")) {
      return "Submit Drill";
    }
    if (pathname.startsWith("/feedback")) {
      return "Feedback";
    }
    if (pathname.startsWith("/suggestions")) {
      return "Suggestions";
    }
    if (pathname.startsWith("/onboarding")) {
      return "Create Team";
    }
    if (pathname.startsWith("/upgrade")) {
      return "Upgrade";
    }
    return "CoachVision";
  };

  const label = getStatusLabel(location.pathname);
  const containerWidthClass =
    label.length > 18 ? "w-[19rem]" : label.length > 14 ? "w-[16.5rem]" : "w-[14rem]";  
  const isMobilePagerEnabled = Boolean(
    mobilePager?.isMobile && mobilePager.isPagerRoute
  );
  const pagerProgress = isMobilePagerEnabled
    ? mobilePager?.progress ?? 0
    : isLibraryActive
      ? 1
      : 0;
  const activeIndicatorTravel = Math.max(containerWidth - 56, 0);
  const isAutoPlanHighlighted = isMobilePagerEnabled ? pagerProgress < 0.5 : isAutoPlanActive;
  const isLibraryHighlighted = isMobilePagerEnabled ? pagerProgress >= 0.5 : isLibraryActive;
  const mobilePagerGap = 12;
  const mobilePagerRestingOffset = containerWidth > 0 ? -pagerProgress * (containerWidth + mobilePagerGap) : 0;
  const mobilePagerTrackOffset = mobilePagerDragOffset ?? mobilePagerRestingOffset;
  const mobilePagerTransition = mobilePager?.isDragging
    ? "none"
    : `transform ${MOBILE_CONTROL_MOTION}`;
  const singleBottomAction =
    mobileBottomAction?.variant === "segmented" ? null : mobileBottomAction;
  const isSegmentedActionActive = Boolean(
    placement === "mobile-bottom" &&
      mobileBottomAction?.active &&
      mobileBottomAction.variant === "segmented"
  );
  const isGeneratedPlanActionActive = Boolean(
    placement === "mobile-bottom" && singleBottomAction?.active
  );
  const generatedPlanFullLabel = singleBottomAction?.label ?? "Save and Continue to Practice";
  const generatedPlanCompactLabel = singleBottomAction?.compactLabel ?? "Continue to practice";
  const segmentedSegments =
    mobileBottomAction?.variant === "segmented" ? mobileBottomAction.segments : [];
  const segmentedFallbackActiveIndex = segmentedSegments.findIndex((segment) => segment.primary);
  const segmentedActiveSegmentIndex =
    segmentedSegments.length > 0
      ? Math.max(
          0,
          Math.min(
            mobileBottomAction?.variant === "segmented"
              ? mobileBottomAction.activeSegmentIndex ?? segmentedFallbackActiveIndex
              : 0,
            segmentedSegments.length - 1
          )
        )
      : 0;
  const segmentedHighlightProgress = Math.min(
    1,
    Math.abs(segmentedSwipeDeltaX) / SEGMENTED_SWIPE_THRESHOLD_PX
  );

  const getSegmentedSegmentLayout = (index: number) => {
    const horizontalPaddingPx = 16;
    const separatorWidthPx = Math.max(segmentedSegments.length - 1, 0) * 9;
    const availableWidth = Math.max(containerWidth - horizontalPaddingPx - separatorWidthPx, 0);
    const weights = segmentedSegments.map((segment) => (segment.primary ? 1.08 : 0.96));
    const totalWeight = weights.reduce((total, weight) => total + weight, 0) || 1;
    const width = availableWidth * ((weights[index] ?? 1) / totalWeight);
    const x =
      8 +
      weights.slice(0, index).reduce((total, weight) => total + availableWidth * (weight / totalWeight), 0) +
      index * 9;

    return { x, width };
  };

  const segmentedActiveLayout = getSegmentedSegmentLayout(segmentedActiveSegmentIndex);
  const segmentedTargetLayout =
    segmentedSwipeTargetIndex === null
      ? segmentedActiveLayout
      : getSegmentedSegmentLayout(segmentedSwipeTargetIndex);
  const segmentedHighlightStyle = {
    x:
      segmentedActiveLayout.x +
      (segmentedTargetLayout.x - segmentedActiveLayout.x) * segmentedHighlightProgress,
    width:
      segmentedActiveLayout.width +
      (segmentedTargetLayout.width - segmentedActiveLayout.width) * segmentedHighlightProgress,
  };

  const setContainerNode = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current === node) return;

    containerResizeObserverRef.current?.disconnect();
    containerResizeObserverRef.current = null;
    containerRef.current = node;

    if (!node) {
      setContainerWidth(0);
      return;
    }

    const updateWidth = () => setContainerWidth(node.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    containerResizeObserverRef.current = observer;
  }, []);

  const resetBarInteractionState = useCallback(() => {
    if (segmentedSwipeTimerRef.current !== null) {
      window.clearTimeout(segmentedSwipeTimerRef.current);
      segmentedSwipeTimerRef.current = null;
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    suppressClickRef.current = false;
    hasPointerCaptureRef.current = false;
    mobilePagerStartOffsetRef.current = 0;
    segmentedSwipeStartXRef.current = null;
    segmentedSwipeStartYRef.current = 0;
    segmentedSwipeLatestDeltaXRef.current = 0;
    segmentedSwipeIntentRef.current = "idle";
    setMobilePagerDragOffset(null);
    setSegmentedSwipeDeltaX(0);
    setSegmentedSwipeTargetIndex(null);
  }, []);

  useEffect(() => {
    return () => {
      if (segmentedSwipeTimerRef.current !== null) {
        window.clearTimeout(segmentedSwipeTimerRef.current);
        segmentedSwipeTimerRef.current = null;
      }
      containerResizeObserverRef.current?.disconnect();
      containerResizeObserverRef.current = null;
    };
  }, []);

  const collapseGeneratedPlanNav = useCallback(() => {
    if (!isGeneratedPlanActionActive) return;
    setGeneratedPlanNavExpanded(false);
  }, [isGeneratedPlanActionActive]);

  useEffect(() => {
    if (!isGeneratedPlanActionActive) {
      setGeneratedPlanNavExpanded(false);
      return;
    }

    window.addEventListener("scroll", collapseGeneratedPlanNav, { passive: true });
    window.addEventListener("touchmove", collapseGeneratedPlanNav, { passive: true });
    return () => {
      window.removeEventListener("scroll", collapseGeneratedPlanNav);
      window.removeEventListener("touchmove", collapseGeneratedPlanNav);
    };
  }, [collapseGeneratedPlanNav, isGeneratedPlanActionActive]);

  useEffect(() => {
    resetBarInteractionState();
  }, [isMobilePagerEnabled, isSegmentedActionActive, location.pathname, resetBarInteractionState]);

  const navigateWithMotion = (path: string, direction: RouteMotionDirection) => {
    emitRouteMotion(direction);
    navigate(path);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.clientX;
    touchDeltaXRef.current = 0;
    suppressClickRef.current = false;
    hasPointerCaptureRef.current = false;
    if (isMobilePagerEnabled) {
      mobilePagerStartOffsetRef.current = mobilePagerRestingOffset;
      setMobilePagerDragOffset(null);
      mobilePager?.beginDrag(event.clientX, event.clientY);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;

    if (isMobilePagerEnabled) {
      const intent = mobilePager?.updateDrag(event.clientX, event.clientY);
      if (intent === "horizontal") {
        const deltaX = event.clientX - touchStartXRef.current;
        setMobilePagerDragOffset(mobilePagerStartOffsetRef.current + deltaX);
        suppressClickRef.current = true;
        if (!hasPointerCaptureRef.current) {
          event.currentTarget.setPointerCapture(event.pointerId);
          hasPointerCaptureRef.current = true;
        }
      }
      return;
    }

    touchDeltaXRef.current = event.clientX - touchStartXRef.current;
    if (Math.abs(touchDeltaXRef.current) > 8) {
      suppressClickRef.current = true;
    }
  };

  const handlePointerEnd = () => {
    if (touchStartXRef.current === null) return;
    if (isMobilePagerEnabled) {
      touchStartXRef.current = null;
      touchDeltaXRef.current = 0;
      mobilePager?.endDrag();
      resetBarInteractionState();
      window.setTimeout(() => {
        suppressClickRef.current = false;
        hasPointerCaptureRef.current = false;
      }, 160);
      return;
    }

    const deltaX = touchDeltaXRef.current;
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;

    if (Math.abs(deltaX) < 36) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      return;
    }

    navigateWithMotion(deltaX > 0 ? "/drills" : "/", deltaX > 0 ? "right" : "left");
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 120);
  };

  const getSegmentedActionTargetIndex = (deltaX: number) => {
    if (
      mobileBottomAction?.variant !== "segmented" ||
      !mobileBottomAction.swipeEnabled ||
      deltaX === 0
    ) {
      return null;
    }

    const targetIndex = segmentedActiveSegmentIndex + (deltaX > 0 ? 1 : -1);
    const targetSegment = mobileBottomAction.segments[targetIndex];

    if (!targetSegment || targetSegment.disabled) {
      return null;
    }

    return targetIndex;
  };

  const getSegmentedVisualTargetIndex = (deltaX: number) => {
    if (
      mobileBottomAction?.variant !== "segmented" ||
      !mobileBottomAction.swipeEnabled ||
      deltaX === 0 ||
      getSegmentedActionTargetIndex(deltaX) === null
    ) {
      return null;
    }

    const targetIndex = segmentedActiveSegmentIndex + (deltaX > 0 ? 1 : -1);
    const targetSegment = mobileBottomAction.segments[targetIndex];

    if (!targetSegment) {
      return null;
    }

    return targetIndex;
  };

  const resetSegmentedSwipeState = (delayMs = 0) => {
    if (segmentedSwipeTimerRef.current !== null) {
      window.clearTimeout(segmentedSwipeTimerRef.current);
      segmentedSwipeTimerRef.current = null;
    }

    const reset = () => {
      segmentedSwipeStartXRef.current = null;
      segmentedSwipeStartYRef.current = 0;
      segmentedSwipeLatestDeltaXRef.current = 0;
      segmentedSwipeIntentRef.current = "idle";
      setSegmentedSwipeDeltaX(0);
      setSegmentedSwipeTargetIndex(null);
      window.setTimeout(() => {
        suppressClickRef.current = false;
        hasPointerCaptureRef.current = false;
      }, 0);
    };

    if (delayMs > 0) {
      segmentedSwipeTimerRef.current = window.setTimeout(reset, delayMs);
      return;
    }

    reset();
  };

  const handleSegmentedPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mobileBottomAction?.variant !== "segmented" || !mobileBottomAction.swipeEnabled) {
      return;
    }

    if (segmentedSwipeTimerRef.current !== null) {
      window.clearTimeout(segmentedSwipeTimerRef.current);
      segmentedSwipeTimerRef.current = null;
    }

    segmentedSwipeStartXRef.current = event.clientX;
    segmentedSwipeStartYRef.current = event.clientY;
    segmentedSwipeLatestDeltaXRef.current = 0;
    segmentedSwipeIntentRef.current = "idle";
    suppressClickRef.current = false;
    hasPointerCaptureRef.current = false;
    setSegmentedSwipeDeltaX(0);
    setSegmentedSwipeTargetIndex(null);
  };

  const handleSegmentedPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      segmentedSwipeStartXRef.current === null ||
      mobileBottomAction?.variant !== "segmented" ||
      !mobileBottomAction.swipeEnabled
    ) {
      return;
    }

    const deltaX = event.clientX - segmentedSwipeStartXRef.current;
    const deltaY = event.clientY - segmentedSwipeStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (segmentedSwipeIntentRef.current === "idle") {
      if (Math.max(absX, absY) < SEGMENTED_SWIPE_DEADZONE_PX) return;

      segmentedSwipeIntentRef.current =
        absX > absY + SEGMENTED_SWIPE_HORIZONTAL_INTENT_BIAS_PX ? "horizontal" : "vertical";

      if (segmentedSwipeIntentRef.current !== "horizontal") {
        return;
      }
    }

    if (segmentedSwipeIntentRef.current !== "horizontal") {
      return;
    }

    const nextTargetIndex = getSegmentedVisualTargetIndex(deltaX);
    segmentedSwipeLatestDeltaXRef.current = deltaX;
    suppressClickRef.current = true;
    setSegmentedSwipeTargetIndex(nextTargetIndex);
    setSegmentedSwipeDeltaX(nextTargetIndex === null ? 0 : deltaX);

    if (!hasPointerCaptureRef.current) {
      event.currentTarget.setPointerCapture(event.pointerId);
      hasPointerCaptureRef.current = true;
    }
  };

  const handleSegmentedPointerEnd = () => {
    if (segmentedSwipeStartXRef.current === null) return;

    const deltaX = segmentedSwipeLatestDeltaXRef.current;
    const actionTargetIndex = getSegmentedActionTargetIndex(deltaX);
    const visualTargetIndex = getSegmentedVisualTargetIndex(deltaX);
    const shouldCommit =
      segmentedSwipeIntentRef.current === "horizontal" &&
      actionTargetIndex !== null &&
      Math.abs(deltaX) >= SEGMENTED_SWIPE_THRESHOLD_PX;

    segmentedSwipeStartXRef.current = null;
    segmentedSwipeLatestDeltaXRef.current = 0;
    segmentedSwipeIntentRef.current = "idle";

    if (!shouldCommit || mobileBottomAction?.variant !== "segmented") {
      resetSegmentedSwipeState();
      return;
    }

    setSegmentedSwipeTargetIndex(visualTargetIndex);
    setSegmentedSwipeDeltaX(deltaX > 0 ? SEGMENTED_SWIPE_THRESHOLD_PX : -SEGMENTED_SWIPE_THRESHOLD_PX);

    if (deltaX > 0) {
      mobileBottomAction.onSwipeLeftToRight?.();
    } else {
      mobileBottomAction.onSwipeRightToLeft?.();
    }

    resetSegmentedSwipeState(SEGMENTED_SWIPE_COMMIT_MS);
  };

  const handleSegmentedPointerCancel = () => {
    resetSegmentedSwipeState();
  };

  const isSeparatorCoveredByHighlight = (index: number) => {
    const highlightedIndex = segmentedSwipeTargetIndex ?? segmentedActiveSegmentIndex;
    return highlightedIndex === index || highlightedIndex === index + 1;
  };

  const renderPagerPill = (
    target: "autoplan" | "library",
    options: { onAutoPlanIconClick?: () => void } = {}
  ) => {
    const isAutoPlanTarget = target === "autoplan";
    const isActiveTarget = isAutoPlanTarget ? pagerProgress < 0.5 : pagerProgress >= 0.5;
    const pillLabel = isAutoPlanTarget ? getStatusLabel("/") : getStatusLabel("/drills");
    const handleAutoPlanClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (suppressClickRef.current) return;
      if (options.onAutoPlanIconClick) {
        options.onAutoPlanIconClick();
        return;
      }
      mobilePager?.goToPage("autoplan");
    };
    const handleLibraryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (suppressClickRef.current) return;
      mobilePager?.goToPage("library");
    };

    return (
      <div
        className={cn(
          "flex h-12 shrink-0 items-center overflow-hidden rounded-full bg-muted px-2 transition-opacity",
          isActiveTarget ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={{ width: containerWidth || undefined }}
        aria-hidden={!isActiveTarget}
      >
        <button
          onClick={handleAutoPlanClick}
          tabIndex={isActiveTarget ? 0 : -1}
          className={cn(
            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            isAutoPlanTarget
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
          )}
          title="Auto-Plan"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        <div className="mx-2 h-6 w-[1px] shrink-0 bg-border" />

        <div className="flex h-10 min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-medium text-foreground">
          {pillLabel}
        </div>

        <div className="mx-2 h-6 w-[1px] shrink-0 bg-border" />

        <button
          onClick={handleLibraryClick}
          tabIndex={isActiveTarget ? 0 : -1}
          className={cn(
            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            isAutoPlanTarget
              ? "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              : "bg-primary text-primary-foreground shadow-sm"
          )}
          title="Drill Library"
        >
          <Library className="h-5 w-5" />
        </button>
      </div>
    );
  };

  if (isSegmentedActionActive && mobileBottomAction?.variant === "segmented") {
    return (
      <div className="flex w-[19rem] max-w-[calc(100vw-2rem)] flex-col items-center gap-1">
        <div
          ref={setContainerNode}
          onPointerDown={handleSegmentedPointerDown}
          onPointerMove={handleSegmentedPointerMove}
          onPointerUp={handleSegmentedPointerEnd}
          onPointerCancel={handleSegmentedPointerCancel}
          className="relative flex h-12 w-[19rem] max-w-[calc(100vw-2rem)] touch-pan-y items-center overflow-hidden rounded-full bg-muted px-2 shadow-sm"
        >
          <span
            className="pointer-events-none absolute top-1 h-10 rounded-full bg-[#168dff] shadow-sm will-change-transform"
            style={{
              width: `${segmentedHighlightStyle.width}px`,
              transform: `translate3d(${segmentedHighlightStyle.x}px, 0, 0)`,
              transition:
                segmentedSwipeIntentRef.current === "horizontal"
                  ? "none"
                  : `transform ${MOBILE_CONTROL_MOTION}, width ${MOBILE_CONTROL_MOTION}`,
            }}
            aria-hidden="true"
          />
          {mobileBottomAction.segments.map((segment, index) => (
            <Fragment key={segment.id ?? segment.label}>
              <button
                type="button"
                onClick={() => {
                  if (suppressClickRef.current) return;
                  segment.onClick();
                }}
                disabled={segment.disabled}
                className={cn(
                  "group relative z-10 flex h-10 min-w-0 items-center justify-center gap-2 rounded-full px-2 text-base font-medium transition-[transform,color,background-color] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none",
                  segment.primary ? "flex-[1.08]" : "flex-[0.96]",
                  (segmentedSwipeTargetIndex ?? segmentedActiveSegmentIndex) === index
                    ? "text-white"
                    : "text-muted-foreground active:bg-background/50 active:text-foreground"
                )}
                aria-label={segment.label}
                title={segment.label}
              >
                {segment.label === "Next" ? (
                  <AnimatedSegmentContent segment={segment} iconAfterLabel />
                ) : (
                  <AnimatedSegmentContent segment={segment} />
                )}
              </button>
              {index < mobileBottomAction.segments.length - 1 && (
                <div
                  className={cn(
                    "relative z-10 mx-1 h-7 w-[1px] shrink-0 bg-border/70 transition-opacity",
                    isSeparatorCoveredByHighlight(index) && "opacity-0"
                  )}
                />
              )}
            </Fragment>
          ))}
        </div>
        {mobileBottomAction.progress && (
          <div
            className="h-1 w-[calc(100%-1.5rem)] overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={mobileBottomAction.progress.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(mobileBottomAction.progress.value)}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.min(100, Math.max(0, mobileBottomAction.progress.value))}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (isGeneratedPlanActionActive && singleBottomAction) {
    return (
      <div
        className="relative h-12 w-full max-w-[calc(100vw-2rem)]"
        style={{ transition: `all ${MOBILE_CONTROL_MOTION}` }}
      >
        {generatedPlanNavExpanded ? (
          <div
            ref={setContainerNode}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute left-0 top-0 h-12 touch-pan-y overflow-hidden transition-[width] will-change-[width]"
            style={{
              width: "calc(100% - 3.75rem)",
              transition: `width ${MOBILE_CONTROL_MOTION}`,
            }}
          >
            <div
              className="flex h-full will-change-transform"
              style={{
                gap: `${mobilePagerGap}px`,
                transform: `translate3d(${mobilePagerTrackOffset}px, 0, 0)`,
                transition: mobilePagerTransition,
              }}
            >
              {renderPagerPill("autoplan", {
                onAutoPlanIconClick: () => setGeneratedPlanNavExpanded(false),
              })}
              {renderPagerPill("library")}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setGeneratedPlanNavExpanded(true)}
            className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary shadow-sm transition-[width,background-color,color] hover:bg-muted/80"
            style={{
              transition: `width ${MOBILE_CONTROL_MOTION}, background-color ${MOBILE_CONTROL_MOTION}, color ${MOBILE_CONTROL_MOTION}`,
            }}
            aria-label="Show navigation"
            title="Generate Practice Plan"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          onClick={singleBottomAction.onClick}
          disabled={singleBottomAction.isLoading}
          className={cn(
            "absolute right-0 top-0 flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-sm transition-[width,background-color,color] hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-70",
            generatedPlanNavExpanded
              ? "px-0"
              : "gap-2 px-4 text-sm"
          )}
          style={{
            width: generatedPlanNavExpanded ? "3rem" : "calc(100% - 3.75rem)",
            transition: `width ${MOBILE_CONTROL_MOTION}, background-color ${MOBILE_CONTROL_MOTION}, color ${MOBILE_CONTROL_MOTION}`,
          }}
          aria-label={generatedPlanNavExpanded ? generatedPlanCompactLabel : generatedPlanFullLabel}
          title={generatedPlanNavExpanded ? generatedPlanCompactLabel : generatedPlanFullLabel}
        >
          {singleBottomAction.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Play className="h-5 w-5 shrink-0" />
          )}
          {!generatedPlanNavExpanded && (
            <span className="min-w-0 truncate whitespace-nowrap">
              {singleBottomAction.isLoading ? "Saving..." : generatedPlanFullLabel}
            </span>
          )}
        </button>
      </div>
    );
  }

  if (isMobilePagerEnabled) {
    return (
      <div className="flex w-full flex-col items-center">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="relative h-12 w-screen touch-pan-y overflow-hidden"
        >
          <div
            ref={setContainerNode}
            className="absolute left-1/2 top-0 h-12 w-[19rem] max-w-[calc(100vw-2rem)] -translate-x-1/2"
          >
            <div
              className="flex h-full will-change-transform"
              style={{
                gap: `${mobilePagerGap}px`,
                transform: `translate3d(${mobilePagerTrackOffset}px, 0, 0)`,
                transition: mobilePagerTransition,
              }}
            >
              {renderPagerPill("autoplan")}
              {renderPagerPill("library")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Search Bar Container - Spotify-style pill shape with icons inside */}
      <div
        ref={setContainerNode}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={cn(
          "relative flex items-center overflow-hidden bg-muted hover:bg-muted/80 rounded-full transition-[width,background-color] duration-300 ease-out h-12 px-2",
          isMobilePagerEnabled
            ? "w-[19rem] max-w-[calc(100vw-2rem)] touch-pan-y"
            : placement === "mobile-bottom"
              ? mobileBottomBarState.widthClass
              : containerWidthClass
        )}
      >
        {isMobilePagerEnabled && (
          <span
            className="pointer-events-none absolute left-2 top-1/2 z-0 h-10 w-10 -translate-y-1/2 rounded-full bg-primary shadow-sm will-change-transform"
            style={{
              transform: `translate3d(${pagerProgress * activeIndicatorTravel}px, -50%, 0)`,
              transition: mobilePager?.isDragging
                ? "none"
                : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            aria-hidden="true"
          />
        )}
      {/* AutoPlan Icon Button - Left side */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (suppressClickRef.current) return;
            if (isMobilePagerEnabled) {
              mobilePager?.goToPage("autoplan");
              return;
            }
            navigateWithMotion("/", "left");
          }}
          className={cn(
            "relative z-10 p-2 rounded-full transition-colors flex-shrink-0",
            isAutoPlanHighlighted
              ? isMobilePagerEnabled
                ? "text-primary-foreground"
                : "bg-primary text-primary-foreground"
              : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
          )}
          title="Auto-Plan"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        {/* Vertical Separator Line - Left */}
        <div className="relative z-10 h-6 w-[1px] bg-border mx-2 flex-shrink-0" />

        {/* Center Label */}
        {placement === "mobile-bottom" ? (
          <AnimatedRouteLabel label={mobileBottomBarState.label} className="relative z-10" />
        ) : (
          <div className="relative z-10 flex-1 h-10 min-w-0 flex items-center justify-center text-[15px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </div>
        )}

        {/* Vertical Separator Line - Right */}
        <div className="relative z-10 h-6 w-[1px] bg-border mx-2 flex-shrink-0" />

        {/* Library Icon Button - Right side */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (suppressClickRef.current) return;
            if (isMobilePagerEnabled) {
              mobilePager?.goToPage("library");
              return;
            }
            navigateWithMotion("/drills", "right");
          }}
          className={cn(
            "relative z-10 p-2 rounded-full transition-colors flex-shrink-0",
            isLibraryHighlighted
              ? isMobilePagerEnabled
                ? "text-primary-foreground"
                : "bg-primary text-primary-foreground"
              : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
          )}
          title="Drill Library"
        >
          <Library className="h-5 w-5" />
        </button>
      </div>

    </div>
  );
};
