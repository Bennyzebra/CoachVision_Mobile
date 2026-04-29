import { useEffect, useRef, useState } from "react";
import { Library, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMobilePager } from "@/components/MobilePagerContext";
import { cn } from "@/lib/utils";

type RouteMotionDirection = "left" | "right";

const emitRouteMotion = (direction: RouteMotionDirection) => {
  window.dispatchEvent(
    new CustomEvent("coachvision:route-motion", {
      detail: { direction },
    })
  );
};

export const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobilePager = useMobilePager();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const suppressClickRef = useRef(false);
  const hasPointerCaptureRef = useRef(false);

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
      return "Onboarding";
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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => setContainerWidth(element.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
      mobilePager?.beginDrag(event.clientX, event.clientY);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;

    if (isMobilePagerEnabled) {
      const intent = mobilePager?.updateDrag(event.clientX, event.clientY);
      if (intent === "horizontal") {
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

  return (
    <div className="flex flex-col items-center w-full">
      {/* Search Bar Container - Spotify-style pill shape with icons inside */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={cn(
          "relative flex items-center overflow-hidden bg-muted hover:bg-muted/80 rounded-full transition-[width,background-color] duration-300 ease-out h-12 px-2",
          isMobilePagerEnabled ? "w-[19rem] max-w-[calc(100vw-2rem)] touch-pan-y" : containerWidthClass
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
        <div className="relative z-10 flex-1 h-10 min-w-0 flex items-center justify-center text-[15px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </div>

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
