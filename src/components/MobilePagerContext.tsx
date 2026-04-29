import { createContext, useContext } from "react";

export type MobilePagerTarget = "autoplan" | "library";

export type MobilePagerContextValue = {
  activeIndex: number;
  progress: number;
  isDragging: boolean;
  isPagerRoute: boolean;
  isMobile: boolean;
  beginDrag: (clientX: number, clientY: number) => void;
  updateDrag: (clientX: number, clientY: number) => "idle" | "horizontal" | "vertical";
  endDrag: () => void;
  goToPage: (target: MobilePagerTarget) => void;
};

export const MobilePagerContext = createContext<MobilePagerContextValue | null>(null);

export const useMobilePager = () => useContext(MobilePagerContext);
