import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronDown,
  Settings,
  Send,
  LogOut,
  Users,
  ClipboardList,
} from "lucide-react";
import logo from "@/assets/CoachVision_Final.png";
import { MobilePagerContext, type MobilePagerContextValue, type MobilePagerTarget } from "@/components/MobilePagerContext";
import { MobilePrimaryPager } from "@/components/MobilePrimaryPager";
import { SearchBar } from "@/components/SearchBar";
import { getMobileHeaderHideProgress } from "@/components/mobileHeaderMotion";
import { useTeam } from "@/contexts/TeamContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

type RouteMotionDirection = "left" | "right" | null;
type DragIntent = "idle" | "horizontal" | "vertical";

const clampPagerProgress = (value: number) => Math.min(1, Math.max(0, value));
const pagerPaths = ["/", "/drills"] as const;
const PAGER_DRAG_DEADZONE_PX = 4;
const PAGER_HORIZONTAL_INTENT_BIAS_PX = 2;
const PAGER_SWIPE_THRESHOLD_RATIO = 0.24;

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTeam } = useTeam();
  const { profile, session, signOut } = useAuth();
  const { theme = "system", setTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileHeaderOffsetPx, setMobileHeaderOffsetPx] = useState(0);
  const [isMobileHeaderTransitioning, setIsMobileHeaderTransitioning] = useState(true);
  const isMobileViewport = true;
  const [routeMotionDirection, setRouteMotionDirection] = useState<RouteMotionDirection>(null);
  const routePagerIndex = location.pathname === "/drills" ? 1 : 0;
  const isPrimaryPagerRoute = location.pathname === "/" || location.pathname === "/drills";
  const [pagerProgress, setPagerProgress] = useState(routePagerIndex);
  const [isPagerDragging, setIsPagerDragging] = useState(false);
  const [isThemeSelectOpen, setIsThemeSelectOpen] = useState(false);  
  const [isProfileDropdownHovered, setIsProfileDropdownHovered] = useState(false);  
  const userEmail = profile?.email ?? session?.user?.email ?? "Email not available";
  const coachFullName = (profile?.coach_name || "Coach").trim();
  const [firstName = "Coach", ...lastNameParts] = coachFullName.split(/\s+/).filter(Boolean);
  const lastName = lastNameParts.join(" ");
  const coachDisplayName = lastName ? `${firstName} ${lastName}` : firstName;  
  const themeTriggerRef = useRef<HTMLButtonElement | null>(null);  
  const mobileHeaderRef = useRef<HTMLElement | null>(null);
  const keepThemeSelectOpenRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const lastTouchYRef = useRef<number | null>(null);
  const touchVelocityRef = useRef(0);
  const pagerStartXRef = useRef(0);
  const pagerStartYRef = useRef(0);
  const pagerStartProgressRef = useRef(0);
  const pagerLatestDeltaXRef = useRef(0);
  const pagerDragIntentRef = useRef<DragIntent>("idle");
  const pagerScrollPositionsRef = useRef([0, 0]);
  const currentPagerIndexRef = useRef(routePagerIndex);

  const savePagerScrollPosition = useCallback((index: number) => {
    pagerScrollPositionsRef.current[index] = window.scrollY;
  }, []);

  const setMobileHeaderOffset = useCallback((nextOffsetPx: number, shouldTransition: boolean) => {
    const nextOffset = Math.max(0, nextOffsetPx);
    setIsMobileHeaderTransitioning(shouldTransition);
    setMobileHeaderOffsetPx((currentOffset) =>
      Math.abs(currentOffset - nextOffset) > 0.5 ? nextOffset : currentOffset
    );
  }, []);

  useEffect(() => {
    const handleTouchMove = (event: TouchEvent) => {
      const nextY = event.touches[0]?.clientY;
      if (typeof nextY !== "number") return;
      if (lastTouchYRef.current !== null) {
        touchVelocityRef.current = nextY - lastTouchYRef.current;
      }
      lastTouchYRef.current = nextY;
    };

    const handleTouchEnd = () => {
      lastTouchYRef.current = null;
      touchVelocityRef.current = 0;
    };

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      const force = Math.abs(delta) + Math.abs(touchVelocityRef.current);
      const headerHeight = mobileHeaderRef.current?.getBoundingClientRect().height ?? 0;

      if (currentY < 16) {
        setMobileHeaderOffset(0, true);
        lastScrollYRef.current = currentY;
        return;
      }

      if (delta > 0) {
        const searchAnchor = location.pathname === "/"
          ? document.querySelector<HTMLElement>("[data-mobile-header-hide-anchor]")
          : null;

        if (searchAnchor && headerHeight > 0) {
          const progress = getMobileHeaderHideProgress({
            headerHeight,
            searchCardTop: searchAnchor.getBoundingClientRect().top,
          });
          setMobileHeaderOffset(progress * headerHeight, false);
        } else if (force > 6 && headerHeight > 0) {
          setMobileHeaderOffset(headerHeight, true);
        }
      } else if (force > 6 && delta < 0) {
        setMobileHeaderOffset(0, true);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [location.pathname, setMobileHeaderOffset]);

  useEffect(() => {
    const handleRouteMotion = (event: Event) => {
      const detail = (event as CustomEvent<{ direction?: RouteMotionDirection }>).detail;
      setRouteMotionDirection(detail?.direction === "right" ? "right" : "left");
    };

    window.addEventListener("coachvision:route-motion", handleRouteMotion);
    return () => window.removeEventListener("coachvision:route-motion", handleRouteMotion);
  }, []);

  useEffect(() => {
    if (!routeMotionDirection) return;
    const timeout = window.setTimeout(() => setRouteMotionDirection(null), 300);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, routeMotionDirection]);

  useEffect(() => {
    if (!isPrimaryPagerRoute || isPagerDragging) return;
    currentPagerIndexRef.current = routePagerIndex;
    setPagerProgress(routePagerIndex);
  }, [isPagerDragging, isPrimaryPagerRoute, routePagerIndex]);

  const snapToPagerIndex = useCallback(
    (targetIndex: number) => {
      const boundedIndex = Math.min(1, Math.max(0, targetIndex));
      const currentIndex = currentPagerIndexRef.current;

      if (isPrimaryPagerRoute) {
        savePagerScrollPosition(currentIndex);
      }

      setIsPagerDragging(false);
      pagerDragIntentRef.current = "idle";
      setPagerProgress(boundedIndex);
      currentPagerIndexRef.current = boundedIndex;

      const targetPath = pagerPaths[boundedIndex];
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }

      window.requestAnimationFrame(() => {
        window.scrollTo(0, pagerScrollPositionsRef.current[boundedIndex] ?? 0);
      });
    },
    [isPrimaryPagerRoute, location.pathname, navigate, savePagerScrollPosition]
  );

  const beginPagerDrag = useCallback((clientX: number, clientY: number) => {
    if (!isPrimaryPagerRoute || !isMobileViewport) return;
    pagerStartXRef.current = clientX;
    pagerStartYRef.current = clientY;
    pagerStartProgressRef.current = pagerProgress;
    pagerLatestDeltaXRef.current = 0;
    pagerDragIntentRef.current = "idle";
  }, [isMobileViewport, isPrimaryPagerRoute, pagerProgress]);

  const updatePagerDrag = useCallback(
    (clientX: number, clientY: number): DragIntent => {
      if (!isPrimaryPagerRoute || !isMobileViewport) return "idle";

      const deltaX = clientX - pagerStartXRef.current;
      const deltaY = clientY - pagerStartYRef.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (pagerDragIntentRef.current === "idle") {
        if (Math.max(absX, absY) < PAGER_DRAG_DEADZONE_PX) return "idle";

        pagerDragIntentRef.current = absX > absY + PAGER_HORIZONTAL_INTENT_BIAS_PX ? "horizontal" : "vertical";

        if (pagerDragIntentRef.current === "horizontal") {
          savePagerScrollPosition(currentPagerIndexRef.current);
          setIsPagerDragging(true);
        }
      }

      if (pagerDragIntentRef.current !== "horizontal") {
        return pagerDragIntentRef.current;
      }

      const viewportWidth = Math.max(window.innerWidth, 1);
      const nextProgress = clampPagerProgress(pagerStartProgressRef.current - deltaX / viewportWidth);
      pagerLatestDeltaXRef.current = deltaX;
      setPagerProgress(nextProgress);
      return "horizontal";
    },
    [isMobileViewport, isPrimaryPagerRoute, savePagerScrollPosition]
  );

  const endPagerDrag = useCallback(() => {
    if (pagerDragIntentRef.current !== "horizontal") {
      pagerDragIntentRef.current = "idle";
      pagerLatestDeltaXRef.current = 0;
      setIsPagerDragging(false);
      return;
    }

    const dragDeltaX = pagerLatestDeltaXRef.current;
    const swipeThreshold = Math.max(window.innerWidth, 1) * PAGER_SWIPE_THRESHOLD_RATIO;
    const currentIndex = currentPagerIndexRef.current;
    const targetIndex =
      Math.abs(dragDeltaX) >= swipeThreshold
        ? currentIndex + (dragDeltaX < 0 ? 1 : -1)
        : currentIndex;

    pagerLatestDeltaXRef.current = 0;
    snapToPagerIndex(targetIndex);
  }, [snapToPagerIndex]);

  const goToPagerPage = useCallback(
    (target: MobilePagerTarget) => {
      snapToPagerIndex(target === "library" ? 1 : 0);
    },
    [snapToPagerIndex]
  );

  const mobilePagerContext = useMemo<MobilePagerContextValue>(
    () => ({
      activeIndex: Math.round(pagerProgress),
      progress: pagerProgress,
      isDragging: isPagerDragging,
      isPagerRoute: isPrimaryPagerRoute,
      isMobile: isMobileViewport,
      beginDrag: beginPagerDrag,
      updateDrag: updatePagerDrag,
      endDrag: endPagerDrag,
      goToPage: goToPagerPage,
    }),
    [
      beginPagerDrag,
      endPagerDrag,
      goToPagerPage,
      isMobileViewport,
      isPagerDragging,
      isPrimaryPagerRoute,
      pagerProgress,
      updatePagerDrag,
    ]
  );
  
  const handleThemeSelectOpenChange = (open: boolean) => {
    if (!open && keepThemeSelectOpenRef.current) {
      keepThemeSelectOpenRef.current = false;
      setIsThemeSelectOpen(true);
      return;
    }

    setIsThemeSelectOpen(open);

    if (!open && !isProfileDropdownHovered) {
      setIsProfileMenuOpen(false);
    }    
  };

  const handleThemeValueChange = (value: string) => {
    keepThemeSelectOpenRef.current = true;
    setTheme(value);
  };

  const handleThemeSectionClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-theme-trigger]")) {
      return;
    }

    themeTriggerRef.current?.click();
  };

  const handleProfileDropdownMouseEnter = () => {
    setIsProfileDropdownHovered(true);
    setIsProfileMenuOpen(true);
  };

  const handleProfileDropdownMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    const nextElement = event.relatedTarget as HTMLElement | null;

    if (
      nextElement?.closest("[data-profile-dropdown-region='true']") ||
      nextElement?.closest("[data-profile-theme-select-content]")
    ) {
      return;
    }

    setIsProfileDropdownHovered(false);

    if (!isThemeSelectOpen) {
      setIsProfileMenuOpen(false);
    }
  };

  const handleNavigate = (path: string) => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate(path);
  };

  const accountMenuContent = (
    <div className="space-y-1">
      <div className="px-3 py-2 text-left">
        <p className="text-sm font-semibold text-foreground break-words">
          {coachDisplayName}
        </p>
        <p className="text-sm text-muted-foreground break-words">{userEmail}</p>
      </div>
      <Separator />
      <div className="px-3 py-1.5" onClick={handleThemeSectionClick}>
        <p className="mb-2 text-sm font-medium">Theme</p>
        <Select
          open={isThemeSelectOpen}
          value={theme}
          onValueChange={handleThemeValueChange}
          onOpenChange={handleThemeSelectOpenChange}
        >
          <SelectTrigger ref={themeTriggerRef} data-theme-trigger className="h-11 md:h-9">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent data-profile-theme-select-content>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <Button variant="ghost" className="h-12 w-full justify-start md:h-10" onClick={() => handleNavigate("/team")}>
        <Users className="mr-3 h-5 w-5 md:h-4 md:w-4" />
        Team & Roster
      </Button>
      <Button variant="ghost" className="h-12 w-full justify-start md:h-10" onClick={() => handleNavigate("/settings")}>
        <Settings className="mr-3 h-5 w-5 md:h-4 md:w-4" />
        Settings
      </Button>
      <Button variant="ghost" className="h-12 w-full justify-start md:h-10" onClick={() => handleNavigate("/practice-tracker")}>
        <ClipboardList className="mr-3 h-5 w-5 md:h-4 md:w-4" />
        Practice History
      </Button>
      <Button variant="ghost" className="h-12 w-full justify-start md:h-10" onClick={() => handleNavigate("/submit")}>
        <Send className="mr-3 h-5 w-5 md:h-4 md:w-4" />
        Submit Drill
      </Button>
      <Separator />
      <Button
        variant="ghost"
        className="h-12 w-full justify-start text-destructive md:h-10"
        onClick={signOut}
      >
        <LogOut className="mr-3 h-5 w-5 md:h-4 md:w-4" />
        Log Out
      </Button>
    </div>
  );

  return (
    <MobilePagerContext.Provider value={mobilePagerContext}>
    <div className="min-h-screen bg-background">
      <nav className="hidden border-b border-border bg-card md:block">
        <div   className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Team name & logo */}
           <div className="flex items-center gap-3 z-10">
              {currentTeam?.logo_url ? (
                <img src={currentTeam.logo_url} alt={currentTeam.team_name} className="h-[2.875rem] w-[2.875rem] rounded-full object-cover" />
              ) : (
                <img src={logo} alt="CoachVision" className="h-[8.05rem]" />
              )}
              <span className="hidden sm:block h-6 w-px rounded-full bg-foreground/40" aria-hidden="true" />
              <span className="font-semibold text-lg hidden sm:block">
                {currentTeam?.team_name || "CoachVision"}
              </span>
            </div>

           {/* Center: Search Bar - absolutely positioned to always be centered on screen */}
            <div className="hidden md:flex md:items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <SearchBar />
            </div>

            {/* Right: Coach dropdown */}
            <div className="flex items-center gap-2 z-10">
              <Popover open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
              <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group relative p-1 pr-7"
                    data-profile-dropdown-region="true"
                    onMouseEnter={handleProfileDropdownMouseEnter}
                    onMouseLeave={handleProfileDropdownMouseLeave}                    
                  >
                <div 
                      className={`
                  relative z-10 h-9 w-9 rounded-full bg-secondary
                        transition-all duration-500 ease-out
                        group-hover:w-[3.25rem] group-hover:rounded-[1.125rem]
                        will-change-[width,border-radius]
                        ${isProfileMenuOpen ? "w-[3.25rem] rounded-[1.125rem]" : ""}
                      `}
                    >
                      <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center text-lg font-semibold text-black">
                        {(profile?.coach_name || "Coach").charAt(0).toUpperCase()}
                      </span>
                    </div>
                                       <ChevronDown
                      className={`absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 z-0 transition-all duration-300 group-hover:opacity-0 ${
                        isProfileMenuOpen ? "opacity-0" : ""
                      }`}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-60"
                  data-profile-dropdown-region="true"                  
                  align="end"
                  sideOffset={0}
                  onMouseEnter={handleProfileDropdownMouseEnter}
                  onMouseLeave={handleProfileDropdownMouseLeave}
                  onInteractOutside={(event) => {
                  const interactionTarget = event.target as HTMLElement;
                    if (interactionTarget.closest("[data-profile-theme-select-content]")) {
                      event.preventDefault();
                    }
                  }}
                >
                  {accountMenuContent}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </nav>

      <header
        ref={mobileHeaderRef}
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden",
          "will-change-transform",
          isMobileHeaderTransitioning && "transition-transform duration-300 ease-out"
        )}
        style={{ transform: `translate3d(0, -${mobileHeaderOffsetPx}px, 0)` }}
      >
        <div className="px-4 pt-[var(--mobile-header-top-padding)]">
          <div className="flex h-14 -translate-y-[var(--mobile-header-content-lift)] items-center justify-between gap-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              onClick={() => handleNavigate("/")}
              aria-label="Go to Auto Plan"
            >
              {currentTeam?.logo_url ? (
                <img src={currentTeam.logo_url} alt={currentTeam.team_name} className="h-[2.5875rem] w-[2.5875rem] rounded-full object-cover" />
              ) : (
                <img src={logo} alt="CoachVision" className="h-[3.45rem] w-auto shrink-0" />
              )}
              <span className="h-6 w-px shrink-0 rounded-full bg-border" aria-hidden="true" />
              <span className="truncate text-base font-semibold">
                {currentTeam?.team_name || "CoachVision"}
              </span>
            </button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-border/70 bg-card"
                  aria-label="Open account menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-base font-semibold text-black">
                    {(profile?.coach_name || "Coach").charAt(0).toUpperCase()}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm !pt-[calc(var(--app-safe-area-top)+1.5rem)] [&>button]:top-[calc(var(--app-safe-area-top)+1rem)]">
                <SheetHeader className="text-left">
                  <SheetTitle>Account</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  {accountMenuContent}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </header>

      <main className="w-full overflow-x-hidden px-4 pb-[calc(5.4rem+var(--app-safe-area-bottom))] pt-[var(--mobile-content-top-offset)] sm:px-6 md:py-6 lg:px-8">
        {isMobileViewport && isPrimaryPagerRoute ? (
          <MobilePrimaryPager progress={pagerProgress} isDragging={isPagerDragging} />
        ) : (
          <div
            key={location.pathname}
            className={cn(
              "will-change-transform",
              routeMotionDirection === "right" && "mobile-screen-slide-right",
              routeMotionDirection === "left" && "mobile-screen-slide-left"
            )}
          >
            {children}
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/45 bg-background/70 pb-[var(--app-safe-area-bottom)] shadow-[0_-10px_28px_rgba(15,23,42,0.10)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 md:hidden">
        <div className="flex h-16 items-center justify-center px-4">
          <SearchBar />
        </div>
      </nav>
    </div>
    </MobilePagerContext.Provider>
  );
};
