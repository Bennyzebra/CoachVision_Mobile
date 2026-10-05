export type TeamSetupNavigationInput = {
  pathname: string;
  teamCount: number;
  teamsLoading: boolean;
  teamsError: string | null;
};

export const getTeamSetupDestination = ({
  pathname,
  teamCount,
  teamsLoading,
  teamsError,
}: TeamSetupNavigationInput) => {
  if (teamsLoading || teamsError) return null;
  const isOnboardingRoute = pathname === "/onboarding";
  if (teamCount === 0 && !isOnboardingRoute) return "/onboarding";
  if (teamCount > 0 && isOnboardingRoute) return "/";
  return null;
};
