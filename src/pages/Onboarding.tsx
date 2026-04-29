import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";

const featureHighlights = [
  {
    title: "Practice plans in minutes",
    description: "Auto-generate plans that align with your team's focus and skill level.",
  },
  {
    title: "Modern drill library",
    description: "Search, filter, and favorite the best drills for any session or focus area.",
  },
  {
    title: "Smart feedback loops",
    description: "Track what works, capture notes, and let CoachVision refine future plans.",
  },
];
type TourStep = {
  target: string;
  mobileTarget?: string;
  title: string;
  description: string;
  tip?: string;
};

const tourSteps: TourStep[] = [
  {
    target: "discover",
    mobileTarget: "discover-mobile",
    title: "Discover drills fast",
    description: "Browse the full library, filter by focus area, and favorite the drills you plan to reuse.",
    tip: "Use tags and favorites to build a personal shortlist before planning.",
  },
  {
    target: "auto-plan",
    mobileTarget: "auto-plan-mobile",
    title: "Auto-Plan",
    description: "Generate a full practice with constraints like time, theme, or skill focus in seconds.",
    tip: "Start here on busy days—CoachVision will draft and you can edit before sharing.",
  },
  {
    target: "plan",
    mobileTarget: "plan-mobile",
    title: "Build manually",
    description: "Drag-and-drop drills into segments, add notes, and save templates for the season.",
  },
  {
    target: "run",
    mobileTarget: "run-mobile",
    title: "Run practice",
    description: "Present your plan with timers, instructions, and quick adjustments during sessions.",
  },
  {
    target: "feedback",
    mobileTarget: "feedback-mobile",
    title: "Collect feedback",
    description: "Log what worked, capture player notes, and let CoachVision adapt future plans.",
    tip: "Adding a quick recap after practice trains the recommendations you see tomorrow.",
  },
];

const Onboarding = () => {
  const [teamName, setTeamName] = useState("");
  const [sport, setSport] = useState("Basketball");
  const [organization, setOrganization] = useState("");
    const [playerCount, setPlayerCount] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [seasonFocus, setSeasonFocus] = useState("");
  const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshTeams } = useTeam();

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        left: Math.random() * 100,
        delay: index * 50,
        duration: 900 + Math.random() * 400,
        color: ["#2563eb", "#f97316", "#22c55e", "#e11d48"][index % 4],
        rotate: Math.random() * 360,
      })),
    []
  );

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);
 
  const steps = useMemo(
    () => [
      {
        title: "Welcome to CoachVision",
        description:
          "We’ll get you set up in under a minute. Thanks for trusting us to support your program!",
      },
      {
        title: "See what's possible",
        description: "A quick tour of the tools coaches use every day.",
      },
      {
        title: "Your team details",
        description: "Tell us about your program so plans feel like they were built for you.",
      },
      {
        title: "Team stats",
        description: "Add context so CoachVision can suggest the right drills and progressions.",
      },
      {
        title: "All set!",
        description: "We’re ready to roll. Let’s build your first plan together.",
      },
    ],
    []
  );
  useEffect(() => {
    if (step === 1 && !hasSeenTour) {
      setShowTour(true);
    }
  }, [step, hasSeenTour]);

  useEffect(() => {
    if (!showTour) return;

    const updateHighlight = () => {
      const activeStep = tourSteps[tourStepIndex];
      const target =
        document.querySelector(`[data-tour-target="${activeStep.target}"]`) ||
        document.querySelector(`[data-tour-target="${activeStep.mobileTarget}"]`);

      if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();
        setHighlightRect(
          new DOMRect(
            rect.left + window.scrollX,
            rect.top + window.scrollY,
            rect.width,
            rect.height
          )
        );
      } else {
        setHighlightRect(null);
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);
    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [showTour, tourStepIndex]);

  const handleCreateTeam = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("teams").insert({
        coach_id: user.id,
        team_name: teamName,
        sport,
        organization: organization || null,
      });

      if (error) throw error;

      await refreshTeams();

      toast({
        title: "Team created!",
        description: "Let's add your roster.",
      });
      setCelebrating(true);
      celebrationTimeoutRef.current = setTimeout(() => navigate("/team"), 1400);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

   const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

   const startTour = () => {
    setTourStepIndex(0);
    setShowTour(true);
    setHasSeenTour(false);
    if (step < 1) {
      setStep(1);
    }
  };

  const closeTour = () => {
    setShowTour(false);
    setHasSeenTour(true);
  };

  const handleTourNext = () => {
    setTourStepIndex((prev) => Math.min(prev + 1, tourSteps.length - 1));
  };

  const handleTourBack = () => {
    setTourStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const highlightStyles: React.CSSProperties = highlightRect
    ? {
        width: highlightRect.width + 12,
        height: highlightRect.height + 12,
        top: highlightRect.top - 6,
        left: highlightRect.left - 6,
      }
    : {
        width: 320,
        height: 90,
        top: 140,
        left: "50%",
        transform: "translateX(-50%)",
      };

  const activeTourStep = tourSteps[tourStepIndex];

  const calloutPosition: React.CSSProperties = highlightRect
    ? {
        top: highlightRect.top + highlightRect.height + 18,
        left: highlightRect.left + highlightRect.width / 2,
        transform: "translateX(-50%)",
      }
    : {
        top: 250,
        left: "50%",
        transform: "translateX(-50%)",
      };

  const cursorStyle: React.CSSProperties = highlightRect
    ? {
        top: highlightRect.top + highlightRect.height / 2 - 8,
        left: highlightRect.left + highlightRect.width - 12,
      }
    : { top: 180, left: "calc(50% + 80px)" };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 overflow-hidden">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Step {step + 1} of {steps.length}</Badge>
            <Progress value={((step + 1) / steps.length) * 100} className="h-2 flex-1" />
          </div>
          <CardTitle className="text-2xl mt-3">{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Let's make you feel at home</h3>
                <p className="text-muted-foreground">
                  CoachVision is built for busy coaches. We'll guide you through creating your team, setting your goals,
                  and show you where to find the tools that save you time.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Guided setup that takes less than a minute</li>
                  <li>• Personalized practice plans informed by your roster</li>
                  <li>• A tour of the features coaches love most</li>
                </ul>
              </div>
              <div className="bg-muted/40 border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">What you'll do:</h4>
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-background rounded border">Share your team basics</div>
                  <div className="p-3 bg-background rounded border">Add quick context and goals</div>
                  <div className="p-3 bg-background rounded border">Jump into practice planning</div>
                </div>
              </div>
                           <div className="lg:col-span-2 bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">See where everything lives</h4>
                    <p className="text-sm text-muted-foreground">
                      Launch a guided overlay that points to each tab, blurs the app behind it, and explains what you can do.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={startTour}>
                      Start navigation guide
                    </Button>
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      Skip to feature tour
                    </Button>
                  </div>
                </div>
              </div>
            </div>
           )}

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featureHighlights.map((feature) => (
                <div key={feature.title} className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
              <div className="md:col-span-3 border rounded-lg p-4 bg-background">
                <h4 className="font-semibold mb-2">Pro tip</h4>
                <p className="text-muted-foreground text-sm">
                  You can revisit this tour anytime from Settings → Onboarding. For now, let's capture your team info so
                  CoachVision can tailor drills, progressions, and reminders to your roster.
                </p>
                                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Prefer a guided walkthrough? The overlay tour will blur the background and highlight the tab being
                    explained.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={startTour}>
                      Relaunch overlay
                    </Button>
                    <Badge variant="secondary">{tourStepIndex + 1} / {tourSteps.length} tabs</Badge>
                  </div>
                </div>
              </div>
            </div>
           )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="Warriors"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sport">Sport</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                    <SelectItem value="Volleyball">Volleyball</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Lincoln High School"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
            </div>
         )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playerCount">Players</Label>
                <Input
                  id="playerCount"
                  type="number"
                  min={1}
                  placeholder="12"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill level</Label>
                <Select value={skillLevel} onValueChange={setSkillLevel}>
                  <SelectTrigger id="skillLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Developmental">Developmental</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Competitive">Competitive</SelectItem>
                    <SelectItem value="Elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seasonFocus">Season focus</Label>
                <Input
                  id="seasonFocus"
                  type="text"
                  placeholder="E.g. Ball movement, defensive pressure"
                  value={seasonFocus}
                  onChange={(e) => setSeasonFocus(e.target.value)}
                />
              </div>
              <div className="md:col-span-3 bg-muted/30 border rounded-lg p-4 text-sm text-muted-foreground">
                These details help us surface the right drills, schedule ideas, and reminders. You can update them
                anytime from Team settings.
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Thanks for choosing CoachVision</h3>
                <p className="text-muted-foreground">
                  You're ready to start planning. We'll use your team info to tailor drill suggestions, progressions,
                  and reminders for your roster size and level.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Next</Badge>
                    <span>Build your first practice plan from the library or Auto Plan.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tip</Badge>
                    <span>Invite assistants and track feedback after each session.</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/40 border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Your onboarding notes</h4>
                <div className="p-3 bg-background rounded border">
                  <div className="text-xs uppercase text-muted-foreground">Team</div>
                  <div className="font-semibold">{teamName || "Team name pending"}</div>
                  <div className="text-sm text-muted-foreground">{sport} · {organization || "Independent"}</div>
                </div>
                <div className="p-3 bg-background rounded border text-sm text-muted-foreground space-y-1">
                  <div><span className="font-medium text-foreground">Players:</span> {playerCount || "Add later"}</div>
                  <div><span className="font-medium text-foreground">Level:</span> {skillLevel}</div>
                  <div><span className="font-medium text-foreground">Focus:</span> {seasonFocus || "We'll help you decide"}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
                <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {step > 0 && <Button variant="ghost" onClick={handleBack}>Back</Button>}
            {step < steps.length - 1 && (
              <Button variant="outline" onClick={handleNext} disabled={step === 2 && !teamName}>
                Continue
              </Button>
            )}
          </div>
          {step === steps.length - 1 ? (
            <Button onClick={handleCreateTeam} disabled={!teamName || loading}>
              {loading ? "Saving..." : "Finish setup"}
            </Button>
          ) : step >= 2 ? (
            <Button onClick={handleNext} disabled={step === 2 && !teamName}>
              Save & continue
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </div>
      </Card>
           {celebrating && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background/60 via-background/70 to-background/60">
          <div className="relative w-full h-full overflow-hidden">
            {confettiPieces.map((piece, index) => (
              <div
                key={index}
                className="absolute w-2 h-4 rounded-sm"
                style={{
                  left: `${piece.left}%`,
                  top: "-12px",
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotate}deg)`,
                  animation: `confetti-fall ${piece.duration}ms ease-out forwards`,
                  animationDelay: `${piece.delay}ms`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/90 border shadow-lg rounded-xl px-6 py-4 text-center animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-muted-foreground">Welcome aboard</p>
                <p className="text-2xl font-semibold">Team created!</p>
              </div>
            </div>
            <style>{`
              @keyframes confetti-fall {
                0% { transform: translate3d(0, -30px, 0) rotate(0deg); opacity: 1; }
                100% { transform: translate3d(0, 240px, 0) rotate(360deg); opacity: 0; }
              }
            `}</style>
          </div>
        </div>
      )}
            {showTour && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md transition-all" />
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-xl border-2 border-primary/80 bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all"
              style={highlightStyles}
            />
            <div
              className="absolute w-4 h-4 rounded-full bg-primary shadow-lg animate-pulse"
              style={cursorStyle}
            >
              <div className="absolute inset-[-8px] rounded-full border border-primary/50 animate-ping" />
            </div>
          </div>

          <div className="absolute" style={calloutPosition}>
            <div className="pointer-events-auto max-w-md rounded-lg border bg-card shadow-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    {activeTourStep.title}
                    <Badge variant="secondary">Tab {tourStepIndex + 1} of {tourSteps.length}</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{activeTourStep.description}</p>
                  {activeTourStep.tip && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/60 p-2 rounded">
                      {activeTourStep.tip}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={closeTour} className="shrink-0">
                  ✕
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
            <Badge variant="outline" className="hidden md:inline-flex bg-background/80 backdrop-blur-sm">
              The background is blurred so you can focus on the highlighted tab
            </Badge>
            <Button variant="ghost" onClick={handleTourBack} disabled={tourStepIndex === 0}>
              Back
            </Button>
            <Button variant="outline" onClick={closeTour}>
              Skip overlay
            </Button>
            <Button onClick={tourStepIndex === tourSteps.length - 1 ? closeTour : handleTourNext}>
              {tourStepIndex === tourSteps.length - 1 ? "Finish tour" : "Next tab"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
