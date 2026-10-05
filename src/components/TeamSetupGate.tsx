import { Navigate, useLocation } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { useTeam } from "@/contexts/TeamContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTeamSetupDestination } from "@/components/teamSetupNavigation";

export const TeamSetupGate = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { teams, teamsLoading, teamsError, refreshTeams } = useTeam();
  const destination = getTeamSetupDestination({
    pathname: location.pathname,
    teamCount: teams.length,
    teamsLoading,
    teamsError,
  });

  if (teamsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          Loading your team…
        </div>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-xl">
          <CardContent className="space-y-5 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">We couldn’t load your teams</h1>
              <p className="text-sm text-muted-foreground">
                Check your connection and try again. Your account information has not been changed.
              </p>
            </div>
            <Button className="h-11 w-full gap-2" onClick={() => void refreshTeams()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (destination) {
    return <Navigate to={destination} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
