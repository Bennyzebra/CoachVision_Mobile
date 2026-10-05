import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Camera, Users, Target, Calendar, Save } from "lucide-react";
import { useTeam } from "@/contexts/TeamContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getPositionAssignmentLabel, getTeamSportRecapLabel } from "./teamHeaderDisplay";
import {
  getTeamLogoStoragePath,
  TEAM_LOGOS_BUCKET,
  validateTeamLogoFile,
} from "./teamLogoUpload";

interface TeamRosterConfig {
  totalPlayers: number;
  ageRangeMin: number;
  ageRangeMax: number;
  positionCounts: {
    guards: number;
    forwards: number;
    centers: number;
  };
}

const DEFAULT_CONFIG: TeamRosterConfig = {
  totalPlayers: 12,
  ageRangeMin: 10,
  ageRangeMax: 14,
  positionCounts: {
    guards: 4,
    forwards: 5,
    centers: 3,
  },
};

const Team = () => {
  const { currentTeam, setCurrentTeam, refreshTeams } = useTeam();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<TeamRosterConfig>(() => {
    const saved = localStorage.getItem(`team-roster-config-${currentTeam?.id || "default"}`);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState(currentTeam?.team_name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreviewUrl, setPendingLogoPreviewUrl] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem(`team-roster-config-${currentTeam?.id || "default"}`);
    if (saved) {
      setConfig(JSON.parse(saved));
    } else {
      setConfig(DEFAULT_CONFIG);
    }
    setHasChanges(false);
    setTeamNameInput(currentTeam?.team_name || "");
    setIsEditingName(false);
    setPendingLogoFile(null);
    setPendingLogoPreviewUrl(null);
  }, [currentTeam?.id, currentTeam?.team_name]);

  useEffect(() => {
    return () => {
      if (pendingLogoPreviewUrl) {
        URL.revokeObjectURL(pendingLogoPreviewUrl);
      }
    };
  }, [pendingLogoPreviewUrl]);

  const updateConfig = (updates: Partial<TeamRosterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updatePositionCount = (
    position: keyof TeamRosterConfig["positionCounts"],
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      positionCounts: {
        ...prev.positionCounts,
        [position]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleTeamLogoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateTeamLogoFile(file);
    if (validationError) {
      toast({
        title: "Unable to use that photo",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setPendingLogoFile(file);
    setPendingLogoPreviewUrl(URL.createObjectURL(file));
    setHasChanges(true);
  };

  const uploadPendingTeamLogo = async () => {
    if (!currentTeam || !pendingLogoFile) {
      return currentTeam;
    }

    const logoPath = getTeamLogoStoragePath({
      coachId: currentTeam.coach_id,
      teamId: currentTeam.id,
      file: pendingLogoFile,
    });

    const { error: uploadError } = await supabase.storage
      .from(TEAM_LOGOS_BUCKET)
      .upload(logoPath, pendingLogoFile, {
        cacheControl: "3600",
        contentType: pendingLogoFile.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(TEAM_LOGOS_BUCKET)
      .getPublicUrl(logoPath);

    const { data, error } = await supabase
      .from("teams")
      .update({ logo_url: publicUrlData.publicUrl })
      .eq("id", currentTeam.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const handleSave = async () => {
    setIsSavingSettings(true);

    try {
      const updatedTeam = await uploadPendingTeamLogo();

      localStorage.setItem(
        `team-roster-config-${currentTeam?.id || "default"}`,
        JSON.stringify(config)
      );

      if (updatedTeam) {
        setCurrentTeam(updatedTeam);
        await refreshTeams();
      }

      setPendingLogoFile(null);
      setPendingLogoPreviewUrl(null);
      setHasChanges(false);
      toast({
        title: pendingLogoFile ? "Team photo saved" : "Team settings saved",
        description: pendingLogoFile
          ? "Your team photo and roster settings have been saved."
          : "Your roster configuration has been saved and will be used for practice planning.",
      });
    } catch (error) {
      toast({
        title: "Unable to save team settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const totalPositions =
    config.positionCounts.guards + config.positionCounts.forwards + config.positionCounts.centers;
  const teamSportLabel = getTeamSportRecapLabel(currentTeam?.sport);
  const playerCountLabel = `${config.totalPlayers} ${config.totalPlayers === 1 ? "player" : "players"}`;
  const positionAssignmentLabel = getPositionAssignmentLabel(totalPositions, config.totalPlayers);
  const positionsBalanced = totalPositions === config.totalPlayers;
  // Team data loads asynchronously. Keep the initial no-team render safe while
  // the context determines whether the coach has a team to display.
  const teamLogoUrl = pendingLogoPreviewUrl ?? currentTeam?.logo_url ?? null;

  const handleTeamNameSave = async () => {
    if (!currentTeam || !teamNameInput.trim() || teamNameInput === currentTeam.team_name) {
      setTeamNameInput(currentTeam?.team_name || "");
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    const { data, error } = await supabase
      .from("teams")
      .update({ team_name: teamNameInput.trim() })
      .eq("id", currentTeam.id)
      .select()
      .single();

    setIsSavingName(false);

    if (error) {
      toast({
        title: "Unable to update team name",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setCurrentTeam(data);
      await refreshTeams();
      toast({
        title: "Team name updated",
        description: "Your team name changes have been saved.",
      });
    }

    setIsEditingName(false);
  };

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Team Selected</h3>
            <p className="text-muted-foreground">
              Please create or select a team to configure your roster settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Team Recap Header */}
      <Card className="rounded-xl border-primary/15 bg-background shadow-sm">
        <CardHeader className="space-y-3 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <button
                type="button"
                className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/10 transition hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Choose team photo"
                title="Choose team photo"
              >
                {teamLogoUrl ? (
                  <img
                    src={teamLogoUrl}
                    alt={`${currentTeam.team_name} team photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-6 w-6 text-primary" />
                )}
                <span className="absolute inset-0 bg-background/0 transition group-hover:bg-background/20" />
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
                  <Camera className="h-3 w-3" aria-hidden="true" />
                </span>
              </button>
              <input
                ref={logoInputRef}
                type="file"
                className="sr-only"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleTeamLogoSelect}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {isEditingName ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    className="h-10"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTeamNameSave();
                      }
                    }}
                    autoFocus
                    disabled={isSavingName}
                  />
                  <Button className="h-10" size="sm" onClick={handleTeamNameSave} disabled={isSavingName}>
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <button
                  className="text-left"
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit team name"
                >
                  <CardTitle className="text-xl leading-tight">{teamNameInput || currentTeam.team_name}</CardTitle>
                </button>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary hover:bg-primary/10">
                  {teamSportLabel}
                </Badge>
                <Badge variant="outline" className="rounded-md bg-background">
                  {playerCountLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                >
                  {config.positionCounts.guards} G
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
                >
                  {config.positionCounts.forwards} F
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200"
                >
                  {config.positionCounts.centers} C
                </Badge>
                <Badge
                  variant={positionsBalanced ? "secondary" : "destructive"}
                  className="rounded-md"
                >
                  {positionAssignmentLabel}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Team Size */}
        <Card className="rounded-xl">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Team Size</CardTitle>
            </div>
            <CardDescription>Total number of players on your roster</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={1}
                max={30}
                value={config.totalPlayers}
                onChange={(e) =>
                  updateConfig({ totalPlayers: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) })
                }
                className="h-12 w-24 text-center text-lg font-semibold"
              />
              <span className="text-muted-foreground">players</span>
            </div>
            <Slider
              value={[config.totalPlayers]}
              onValueChange={([value]) => updateConfig({ totalPlayers: value })}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">Adjust based on your typical practice attendance</p>
          </CardContent>
        </Card>

        {/* Age Range */}
        <Card className="rounded-xl">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Age Range</CardTitle>
            </div>
            <CardDescription>Age range of players on your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="space-y-1">
                <Label htmlFor="minAge" className="text-xs text-muted-foreground">
                  Min Age
                </Label>
                <Input
                  id="minAge"
                  type="number"
                  min={5}
                  max={config.ageRangeMax}
                  value={config.ageRangeMin}
                  onChange={(e) =>
                    updateConfig({
                      ageRangeMin: Math.max(5, Math.min(config.ageRangeMax, parseInt(e.target.value) || 5)),
                    })
                  }
                  className="h-11 w-20 text-center"
                />
              </div>
              <span className="text-muted-foreground mt-5">to</span>
              <div className="space-y-1">
                <Label htmlFor="maxAge" className="text-xs text-muted-foreground">
                  Max Age
                </Label>
                <Input
                  id="maxAge"
                  type="number"
                  min={config.ageRangeMin}
                  max={25}
                  value={config.ageRangeMax}
                  onChange={(e) =>
                    updateConfig({
                      ageRangeMax: Math.max(config.ageRangeMin, Math.min(25, parseInt(e.target.value) || 25)),
                    })
                  }
                  className="h-11 w-20 text-center"
                />
              </div>
              <span className="text-muted-foreground mt-5">years old</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Youth (8-12)", min: 8, max: 12 },
                { label: "Middle School (11-14)", min: 11, max: 14 },
                { label: "High School (14-18)", min: 14, max: 18 },
                { label: "Adult (18+)", min: 18, max: 25 },
              ].map((preset) => (
                <Badge
                  key={preset.label}
                  variant={config.ageRangeMin === preset.min && config.ageRangeMax === preset.max ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 hover:bg-primary/10"
                  onClick={() => updateConfig({ ageRangeMin: preset.min, ageRangeMax: preset.max })}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
        
      {/* Position Distribution */}
      <Card className="rounded-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Position Distribution</CardTitle>
            </div>
            <Badge className="w-fit" variant={totalPositions === config.totalPlayers ? "default" : "destructive"}>
              {totalPositions} / {config.totalPlayers} assigned
            </Badge>
          </div>
          <CardDescription>
            How many players at each position? This helps tailor drill selection and groupings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            {/* Guards */}
            <div className="space-y-3 rounded-lg border bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Guards</Label>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {config.positionCounts.guards}
                </Badge>
              </div>
              <Slider
                value={[config.positionCounts.guards]}
                onValueChange={([value]) => updatePositionCount("guards", value)}
                min={0}
                max={config.totalPlayers}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Point guards, shooting guards</p>
            </div>

            {/* Forwards */}
            <div className="space-y-3 rounded-lg border bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Forwards</Label>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {config.positionCounts.forwards}
                </Badge>
              </div>
              <Slider
                value={[config.positionCounts.forwards]}
                onValueChange={([value]) => updatePositionCount("forwards", value)}
                min={0}
                max={config.totalPlayers}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Small forwards, power forwards</p>
            </div>

            {/* Centers */}
            <div className="space-y-3 rounded-lg border bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Centers</Label>
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {config.positionCounts.centers}
                </Badge>
              </div>
              <Slider
                value={[config.positionCounts.centers]}
                onValueChange={([value]) => updatePositionCount("centers", value)}
                min={0}
                max={config.totalPlayers}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Post players, big men</p>
            </div>
          </div>

          {totalPositions !== config.totalPlayers && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {totalPositions < config.totalPlayers
                  ? `You have ${config.totalPlayers - totalPositions} player(s) not assigned to a position.`
                  : `You have ${totalPositions - config.totalPlayers} more position(s) than players.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="z-30 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:sticky md:bottom-0 md:mx-0 md:flex md:justify-end md:border-0 md:bg-transparent md:px-0 md:py-0">
          <Button onClick={handleSave} className="h-11 w-full gap-2 md:w-auto" disabled={isSavingSettings}>
            <Save className="h-4 w-4" />
            {isSavingSettings ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Team;
