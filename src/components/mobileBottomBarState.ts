export type MobileBottomBarState = {
  label: string;
  routeKey: string;
  widthClass: string;
};

const MOBILE_BOTTOM_BAR_WIDTH_CLASS = "w-[19rem] max-w-[calc(100vw-2rem)]";

export const getMobileBottomBarState = (pathname: string): MobileBottomBarState => {
  if (pathname === "/") {
    return {
      label: "Generate Practice Plan",
      routeKey: "autoplan",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/plan")) {
    return {
      label: "Practice Plan",
      routeKey: "plan",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/run")) {
    return {
      label: "Run Practice",
      routeKey: "run",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/drill")) {
    return {
      label: "Drill Details",
      routeKey: "drill",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/discover") || pathname.startsWith("/drills")) {
    return {
      label: "Discover Drills",
      routeKey: "drills",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/team")) {
    return {
      label: "Team & Roster",
      routeKey: "team",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      label: "Settings",
      routeKey: "settings",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/practice-tracker")) {
    return {
      label: "Practice History",
      routeKey: "practice-tracker",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/submit")) {
    return {
      label: "Submit Drill",
      routeKey: "submit",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/feedback")) {
    return {
      label: "Feedback",
      routeKey: "feedback",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/suggestions")) {
    return {
      label: "Suggestions",
      routeKey: "suggestions",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/onboarding")) {
    return {
      label: "Onboarding",
      routeKey: "onboarding",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  if (pathname.startsWith("/upgrade")) {
    return {
      label: "Upgrade",
      routeKey: "upgrade",
      widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
    };
  }

  return {
    label: "CoachVision",
    routeKey: "default",
    widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS,
  };
};
