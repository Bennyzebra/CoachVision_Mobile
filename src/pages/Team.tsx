import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Calendar, Save, Sparkles } from "lucide-react";
import { useTeam } from "@/contexts/TeamContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { currentTeam, profile, setCurrentTeam, refreshTeams } = useTeam();
  const { toast } = useToast();

  const [config, setConfig] = useState<TeamRosterConfig>(() => {
    const saved = localStorage.getItem(`team-roster-config-${currentTeam?.id || "default"}`);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState(currentTeam?.team_name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
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
  }, [currentTeam?.id]);

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

const handleSave = () => {
    localStorage.setItem(
      `team-roster-config-${currentTeam?.id || "default"}`,
      JSON.stringify(config)
    );
    setHasChanges(false);
    toast({
      title: "Team settings saved",
      description:
        "Your roster configuration has been saved and will be used for practice planning.",
    });
  };

  const totalPositions =
    config.positionCounts.guards + config.positionCounts.forwards + config.positionCounts.centers;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Configure your team for optimized practice planning</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Team Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
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
                  <Button size="sm" onClick={handleTeamNameSave} disabled={isSavingName}>
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <button
                  className="text-left"
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit team name"
                >
                  <CardTitle className="text-xl">{teamNameInput || currentTeam.team_name}</CardTitle>
                </button>
              )}
              <CardDescription className="text-sm text-muted-foreground">
                Coach {profile?.coach_name || "Coach"}
              </CardDescription>
              <CardDescription>{currentTeam.organization || currentTeam.sport}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Optimization Notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
             <p className="font-medium text-amber-800 dark:text-amber-200">Optimize Your Practice Plans</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                These settings help our AI generate better practice plans tailored to your team size, age group, and
                position distribution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Size */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Team Size</CardTitle>
            </div>
            <CardDescription>Total number of players on your roster</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={1}
                max={30}
                value={config.totalPlayers}
                onChange={(e) =>
                  updateConfig({ totalPlayers: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) })
                }
                className="w-24 text-center text-lg font-semibold"
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Age Range</CardTitle>
            </div>
            <CardDescription>Age range of players on your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
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
                  className="w-20 text-center"
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
                  className="w-20 text-center"
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
                  className="cursor-pointer hover:bg-primary/10"
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Position Distribution</CardTitle>
            </div>
            <Badge variant={totalPositions === config.totalPlayers ? "default" : "destructive"}>
              {totalPositions} / {config.totalPlayers} assigned
            </Badge>
          </div>
          <CardDescription>
            How many players at each position? This helps tailor drill selection and groupings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Guards */}
            <div className="space-y-3">
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
            <div className="space-y-3">
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
            <div className="space-y-3">
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
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {totalPositions < config.totalPlayers
                  ? `You have ${config.totalPlayers - totalPositions} player(s) not assigned to a position.`
                  : `You have ${totalPositions - config.totalPlayers} more position(s) than players.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-background border">
              <div className="text-3xl font-bold text-primary">{config.totalPlayers}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <div className="text-3xl font-bold text-primary">{config.ageRangeMin}-{config.ageRangeMax}</div>
              <div className="text-sm text-muted-foreground">Age Range</div>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <div className="text-3xl font-bold text-blue-600">{config.positionCounts.guards}</div>
              <div className="text-sm text-muted-foreground">Guards</div>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <div className="text-3xl font-bold text-green-600">
                {config.positionCounts.forwards + config.positionCounts.centers}
              </div>
              <div className="text-sm text-muted-foreground">Bigs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
