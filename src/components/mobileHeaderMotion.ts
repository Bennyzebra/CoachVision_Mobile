type MobileHeaderHideProgressInput = {
  headerHeight: number;
  searchCardTop: number;
};

const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

export const shouldUseMobileHeaderHideAnchor = (pathname: string) =>
  getMobileHeaderHideAnchorSelector(pathname) !== null;

export const getMobileHeaderHideAnchorSelector = (pathname: string) => {
  if (pathname === "/") return '[data-mobile-header-hide-anchor="autoplan"]';
  if (pathname === "/drills") return '[data-mobile-header-hide-anchor="drills"]';
  return null;
};

export const getMobileHeaderHideProgress = ({
  headerHeight,
  searchCardTop,
}: MobileHeaderHideProgressInput) => {
  if (headerHeight <= 0) return 0;

  return clampProgress((headerHeight - searchCardTop) / headerHeight);
};
