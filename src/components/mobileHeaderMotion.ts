type MobileHeaderHideProgressInput = {
  headerHeight: number;
  searchCardTop: number;
};

const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

export const shouldUseMobileHeaderHideAnchor = (pathname: string) =>
  pathname === "/" || pathname === "/drills";

export const getMobileHeaderHideProgress = ({
  headerHeight,
  searchCardTop,
}: MobileHeaderHideProgressInput) => {
  if (headerHeight <= 0) return 0;

  return clampProgress((headerHeight - searchCardTop) / headerHeight);
};
