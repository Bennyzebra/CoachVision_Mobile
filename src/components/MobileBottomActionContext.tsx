import { createContext, useContext, type ReactNode } from "react";

export type MobileBottomSingleActionRegistration = {
  variant?: "single";
  active: boolean;
  label: string;
  compactLabel: string;
  isLoading: boolean;
  onClick: () => void;
};

export type MobileBottomSegmentedAction = {
  id?: string;
  label: string;
  compactLabel?: string;
  icon?: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export type MobileBottomSegmentedActionRegistration = {
  variant: "segmented";
  active: boolean;
  segments: MobileBottomSegmentedAction[];
  activeSegmentIndex?: number;
  swipeEnabled?: boolean;
  onSwipeLeftToRight?: () => void;
  onSwipeRightToLeft?: () => void;
};

export type MobileBottomActionRegistration =
  | MobileBottomSingleActionRegistration
  | MobileBottomSegmentedActionRegistration;

export type MobileBottomActionContextValue = {
  action: MobileBottomActionRegistration | null;
  registerMobileBottomAction: (
    action: MobileBottomActionRegistration | null
  ) => () => void;
};

export const MobileBottomActionContext = createContext<MobileBottomActionContextValue>({
  action: null,
  registerMobileBottomAction: () => () => undefined,
});

export const useMobileBottomAction = () => useContext(MobileBottomActionContext);
