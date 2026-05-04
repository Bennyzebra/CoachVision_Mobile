import { createContext, useContext } from "react";

export type MobileBottomActionRegistration = {
  active: boolean;
  label: string;
  compactLabel: string;
  isLoading: boolean;
  onClick: () => void;
};

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
