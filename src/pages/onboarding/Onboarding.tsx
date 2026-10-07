import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { useMobileBottomAction } from "@/components/MobileBottomActionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CREATE_TEAM_STEP_COUNT,
  addPracticePriority,
  createInitialTeamDraft,
  createPlayerDraft,
  formatPlayerHeight,
  getStepErrors,
  isStepValid,
  type CreateTeamDraft,
  type CreateTeamStep,
  type DraftErrors,
  type PlayerDraft,
} from "@/lib/createTeamDraft";
import { cn } from "@/lib/utils";

const stepTitles = [
  "Create your first team",
  "Team profile",
  "Practice environment",
  "Build your roster",
  "Review your team",
] as const;

const agePresets = [
  { label: "Youth", detail: "8–12", min: "8", max: "12" },
  { label: "Middle school", detail: "11–14", min: "11", max: "14" },
  { label: "High school", detail: "14–18", min: "14", max: "18" },
  { label: "Adult", detail: "18+", min: "18", max: "99" },
];

const priorityOptions = [
  "Fundamentals",
  "Ball movement",
  "Shooting",
  "Offense",
  "Defense",
  "Rebounding",
  "Conditioning",
  "Team chemistry",
];

const equipmentOptions = [
  "Basketballs",
  "Cones",
  "Pinnies",
  "Agility ladders",
  "Resistance bands",
  "Pads",
];

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="text-sm font-medium text-destructive" role="alert">
      {message}
    </p>
  ) : null;

const ChoicePill = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      "tap-target inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-left text-sm font-medium [overflow-wrap:anywhere] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      selected
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
    )}
  >
    {selected && <Check className="h-4 w-4" aria-hidden="true" />}
    {children}
  </button>
);

type PlayerCardProps = {
  player: PlayerDraft;
  index: number;
  errors: DraftErrors;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  onChange: (updates: Partial<PlayerDraft>) => void;
  onRemove: () => void;
};

const PlayerCard = ({
  player,
  index,
  errors,
  expanded,
  onExpandedChange,
  onChange,
  onRemove,
}: PlayerCardProps) => {
  const prefix = `players.${player.id}`;
  const playerErrors = Object.entries(errors).filter(([key]) => key.startsWith(prefix));
  const isOpen = expanded;
  const [isEditingJerseyNumber, setIsEditingJerseyNumber] = useState(false);
  const jerseyNumberInputRef = useRef<HTMLInputElement>(null);
  const errorFor = (field: keyof PlayerDraft) => errors[`${prefix}.${field}`];

  const editJerseyNumber = () => {
    setIsEditingJerseyNumber(true);
    window.requestAnimationFrame(() => jerseyNumberInputRef.current?.focus());
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onExpandedChange}>
      <Card className={cn("overflow-hidden rounded-xl", playerErrors.length > 0 && "border-destructive/50")}>
        <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5">
          {isEditingJerseyNumber ? (
            <Input
              ref={jerseyNumberInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={player.jerseyNumber}
              placeholder={`${index + 1}`}
              onChange={(event) => onChange({ jerseyNumber: event.target.value })}
              onBlur={() => setIsEditingJerseyNumber(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  event.currentTarget.blur();
                }
              }}
              className="h-9 w-9 min-w-0 max-w-9 shrink-0 rounded-full border-primary bg-primary px-0 text-center text-base font-semibold text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:ring-primary"
              aria-label={`Jersey number for ${player.name.trim() || `Player ${index + 1}`}`}
            />
          ) : (
            <button
              type="button"
              onClick={editJerseyNumber}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                player.jerseyNumber ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              aria-label={`Edit jersey number for ${player.name.trim() || `Player ${index + 1}`}`}
              title="Edit jersey number"
            >
              {player.jerseyNumber ? Number(player.jerseyNumber) : index + 1}
            </button>
          )}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`${isOpen ? "Collapse" : "Expand"} Player ${index + 1}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {player.name.trim() || `Player ${index + 1}`}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[player.position, formatPlayerHeight(player)].filter(Boolean).join(" · ") || "Player details needed"}
                </span>
              </span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${player.name.trim() || `Player ${index + 1}`}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <CollapsibleContent className="player-card-collapsible border-t px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-3" data-field-error={Boolean(errorFor("name")) || undefined}>
              <Label htmlFor={`${player.id}-name`}>Player name <span className="text-destructive">*</span></Label>
              <Input
                id={`${player.id}-name`}
                value={player.name}
                maxLength={80}
                placeholder="Player name"
                onChange={(event) => onChange({ name: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                    onExpandedChange(false);
                  }
                }}
                aria-invalid={Boolean(errorFor("name"))}
              />
              <FieldError message={errorFor("name")} />
            </div>
            <div className="space-y-2 md:col-span-2" data-field-error={Boolean(errorFor("jerseyNumber")) || undefined}>
              <Label htmlFor={`${player.id}-jersey`}>Jersey #</Label>
              <Input
                id={`${player.id}-jersey`}
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={player.jerseyNumber}
                placeholder="12"
                onChange={(event) => onChange({ jerseyNumber: event.target.value })}
                aria-invalid={Boolean(errorFor("jerseyNumber"))}
              />
              <FieldError message={errorFor("jerseyNumber")} />
            </div>
            <div className="space-y-2 md:col-span-3" data-field-error={Boolean(errorFor("position")) || undefined}>
              <Label htmlFor={`${player.id}-position`}>Position <span className="text-destructive">*</span></Label>
              <Select value={player.position} onValueChange={(position: PlayerDraft["position"]) => onChange({ position })}>
                <SelectTrigger id={`${player.id}-position`} aria-invalid={Boolean(errorFor("position"))}>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="G">Guard</SelectItem>
                  <SelectItem value="F">Forward</SelectItem>
                  <SelectItem value="C">Center</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={errorFor("position")} />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Height <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <div data-field-error={Boolean(errorFor("heightFeet")) || undefined}>
                  <div className="relative">
                    <Input
                      aria-label={`${player.name || `Player ${index + 1}`} height feet`}
                      type="number"
                      inputMode="numeric"
                      min={3}
                      max={8}
                      value={player.heightFeet}
                      placeholder="5"
                      className="pr-9"
                      onChange={(event) => onChange({ heightFeet: event.target.value })}
                      aria-invalid={Boolean(errorFor("heightFeet"))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ft</span>
                  </div>
                  <FieldError message={errorFor("heightFeet")} />
                </div>
                <div data-field-error={Boolean(errorFor("heightInches")) || undefined}>
                  <div className="relative">
                    <Input
                      aria-label={`${player.name || `Player ${index + 1}`} height inches`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={11}
                      value={player.heightInches}
                      placeholder="8"
                      className="pr-9"
                      onChange={(event) => onChange({ heightInches: event.target.value })}
                      aria-invalid={Boolean(errorFor("heightInches"))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">in</span>
                  </div>
                  <FieldError message={errorFor("heightInches")} />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const Onboarding = () => {
  const [draft, setDraft] = useState<CreateTeamDraft>(() => createInitialTeamDraft());
  const [step, setStep] = useState<CreateTeamStep>(0);
  const [revealedSteps, setRevealedSteps] = useState<Set<CreateTeamStep>>(() => new Set());
  const [customPriority, setCustomPriority] = useState("");
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(() => new Set());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { registerMobileBottomAction } = useMobileBottomAction();

  const currentErrors = useMemo(() => getStepErrors(draft, step), [draft, step]);
  const visibleErrors = revealedSteps.has(step) ? currentErrors : {};

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const revealCurrentStepErrors = useCallback(() => {
    setRevealedSteps((current) => new Set(current).add(step));
    if (step === 3) {
      const errors = getStepErrors(draft, step);
      setExpandedPlayers((current) => {
        const next = new Set(current);
        draft.players.forEach((player) => {
          if (Object.keys(errors).some((key) => key.startsWith(`players.${player.id}.`))) next.add(player.id);
        });
        return next;
      });
    }
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-field-error='true'] input, [data-field-error='true'] textarea, [data-field-error='true'] button")?.focus();
    });
  }, [draft, step]);

  const goBack = useCallback(() => {
    setStep((current) => Math.max(0, current - 1) as CreateTeamStep);
  }, []);

  const goNext = useCallback(() => {
    if (step === 4) return;
    if (!isStepValid(draft, step)) {
      revealCurrentStepErrors();
      return;
    }
    setStep((current) => Math.min(4, current + 1) as CreateTeamStep);
  }, [draft, revealCurrentStepErrors, step]);

  useEffect(() => {
    const nextLabel = step === 3 ? "Review" : step === 4 ? "Create Team" : "Continue";
    return registerMobileBottomAction({
      variant: "segmented",
      active: true,
      activeSegmentIndex: 1,
      swipeEnabled: false,
      progress: {
        value: ((step + 1) / CREATE_TEAM_STEP_COUNT) * 100,
        label: `Create team progress: step ${step + 1} of ${CREATE_TEAM_STEP_COUNT}`,
      },
      segments: [
        {
          id: "create-team-back",
          label: "Back",
          icon: <ArrowLeft className="h-4 w-4" aria-hidden="true" />,
          disabled: step === 0,
          onClick: goBack,
        },
        {
          id: "create-team-next",
          label: nextLabel,
          icon: step < 4 ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />,
          primary: true,
          disabled: step === 4,
          onClick: goNext,
        },
      ],
    });
  }, [goBack, goNext, registerMobileBottomAction, step]);

  const setDraftFields = (updates: Partial<CreateTeamDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  };

  const toggleDraftArrayValue = (field: "practicePriorities" | "equipment", value: string) => {
    setDraft((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value) ? values.filter((item) => item !== value) : addPracticePriority(values, value),
      };
    });
  };

  const addCustomPriority = () => {
    const matchingPreset = priorityOptions.find(
      (priority) => priority.toLocaleLowerCase() === customPriority.trim().toLocaleLowerCase()
    );
    setDraft((current) => ({
      ...current,
      practicePriorities: addPracticePriority(current.practicePriorities, matchingPreset ?? customPriority),
    }));
    setCustomPriority("");
  };

  const updatePlayer = (playerId: string, updates: Partial<PlayerDraft>) => {
    setDraft((current) => ({
      ...current,
      players: current.players.map((player) => (player.id === playerId ? { ...player, ...updates } : player)),
    }));
  };

  const addPlayer = () => {
    const player = createPlayerDraft();
    setDraft((current) => ({ ...current, players: [...current.players, player] }));
    setExpandedPlayers((current) => new Set(current).add(player.id));
    window.requestAnimationFrame(() => document.getElementById(`${player.id}-name`)?.focus());
  };

  const removePlayer = (playerId: string) => {
    setDraft((current) => ({
      ...current,
      players: current.players.filter((player) => player.id !== playerId),
    }));
    setExpandedPlayers((current) => {
      const next = new Set(current);
      next.delete(playerId);
      return next;
    });
  };

  const renderTeamIdentity = () => (
    <div className="space-y-5">
      <div className="space-y-2" data-field-error={Boolean(visibleErrors.teamName) || undefined}>
        <Label htmlFor="team-name">Team name <span className="text-destructive">*</span></Label>
        <Input
          id="team-name"
          value={draft.teamName}
          maxLength={60}
          autoComplete="organization"
          placeholder="Northside Falcons"
          className="h-12"
          onChange={(event) => setDraftFields({ teamName: event.target.value })}
          aria-invalid={Boolean(visibleErrors.teamName)}
        />
        <FieldError message={visibleErrors.teamName} />
      </div>

      <div className="space-y-2">
        <Label>Sport</Label>
        <div className="flex min-h-12 items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-4">
          <CircleDot className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium">Basketball</p>
            <p className="text-xs text-muted-foreground">The supported sport for this version</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Selected</span>
        </div>
      </div>

      <div className="space-y-2" data-field-error={Boolean(visibleErrors.organization) || undefined}>
        <Label htmlFor="organization">Organization <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input
          id="organization"
          enterKeyHint="done"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          value={draft.organization}
          maxLength={80}
          placeholder="School, club, or community program"
          className="h-12"
          onChange={(event) => setDraftFields({ organization: event.target.value })}
          aria-invalid={Boolean(visibleErrors.organization)}
        />
        <FieldError message={visibleErrors.organization} />
      </div>
    </div>
  );

  const renderTeamProfile = () => (
    <div className="space-y-7">
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Player age range <span className="text-destructive">*</span></h3>
          <p className="mt-1 text-sm text-muted-foreground">We’ll match drill complexity and teaching cues to this range.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {agePresets.map((preset) => {
            const selected = draft.ageRangeMin === preset.min && draft.ageRangeMax === preset.max;
            return (
              <ChoicePill key={preset.label} selected={selected} onClick={() => setDraftFields({ ageRangeMin: preset.min, ageRangeMax: preset.max })}>
                {preset.label} <span className={selected ? "text-primary-foreground/75" : "text-muted-foreground"}>{preset.detail}</span>
              </ChoicePill>
            );
          })}
        </div>
        <div className="grid max-w-md grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="space-y-2" data-field-error={Boolean(visibleErrors.ageRangeMin) || undefined}>
            <Label htmlFor="min-age">Minimum age</Label>
            <Input
              id="min-age"
              type="number"
              inputMode="numeric"
              min={5}
              max={99}
              value={draft.ageRangeMin}
              onChange={(event) => setDraftFields({ ageRangeMin: event.target.value })}
              aria-invalid={Boolean(visibleErrors.ageRangeMin)}
            />
            <FieldError message={visibleErrors.ageRangeMin} />
          </div>
          <span className="pb-3 text-sm text-muted-foreground">to</span>
          <div className="space-y-2" data-field-error={Boolean(visibleErrors.ageRangeMax) || undefined}>
            <Label htmlFor="max-age">Maximum age</Label>
            <Input
              id="max-age"
              type="number"
              inputMode="numeric"
              min={5}
              max={99}
              value={draft.ageRangeMax}
              onChange={(event) => setDraftFields({ ageRangeMax: event.target.value })}
              aria-invalid={Boolean(visibleErrors.ageRangeMax)}
            />
            <FieldError message={visibleErrors.ageRangeMax} />
          </div>
        </div>
      </section>

      <section className="space-y-3" data-field-error={Boolean(visibleErrors.teamLevel) || undefined}>
        <div>
          <h3 className="font-semibold">Overall team level <span className="text-destructive">*</span></h3>
          <p className="mt-1 text-sm text-muted-foreground">Choose the level that best represents most of the roster today.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["beginner", "Beginner", "Learning rules and core fundamentals"],
            ["intermediate", "Intermediate", "Comfortable with team concepts"],
            ["advanced", "Advanced", "Competitive pace and complex reads"],
          ] as const).map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              aria-pressed={draft.teamLevel === value}
              onClick={() => setDraftFields({ teamLevel: value })}
              className={cn(
                "min-h-24 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                draft.teamLevel === value ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "bg-background hover:border-primary/40"
              )}
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                {label}
                {draft.teamLevel === value && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
        <FieldError message={visibleErrors.teamLevel} />
      </section>

      <section className="space-y-3" data-field-error={Boolean(visibleErrors.practicePriorities) || undefined}>
        <div>
          <h3 className="font-semibold">Practice priorities <span className="text-destructive">*</span></h3>
          <p className="mt-1 text-sm text-muted-foreground">Select every area you want future plans to reinforce.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((priority) => (
            <ChoicePill key={priority} selected={draft.practicePriorities.includes(priority)} onClick={() => toggleDraftArrayValue("practicePriorities", priority)}>
              {priority}
            </ChoicePill>
          ))}
          {draft.practicePriorities.filter((priority) => !priorityOptions.includes(priority)).map((priority) => (
            <ChoicePill key={priority} selected onClick={() => toggleDraftArrayValue("practicePriorities", priority)}>
              {priority}
            </ChoicePill>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <Input
            aria-label="Write in a practice priority"
            value={customPriority}
            placeholder="Write in another priority"
            onChange={(event) => setCustomPriority(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomPriority();
              }
            }}
            className="min-w-0 flex-1"
          />
          <Button type="button" variant="outline" onClick={addCustomPriority} disabled={!customPriority.trim()}>
            Add priority
          </Button>
        </div>
        <FieldError message={visibleErrors.practicePriorities} />
      </section>

      <section className="space-y-2" data-field-error={Boolean(visibleErrors.coachingNotes) || undefined}>
        <Label htmlFor="coaching-notes">Coaching notes <span className="text-destructive">*</span></Label>
        <Textarea
          id="coaching-notes"
          value={draft.coachingNotes}
          placeholder="What is this team working toward this season?"
          onChange={(event) => setDraftFields({ coachingNotes: event.target.value })}
          aria-invalid={Boolean(visibleErrors.coachingNotes)}
        />
        <FieldError message={visibleErrors.coachingNotes} />
      </section>
    </div>
  );

  const renderPracticeEnvironment = () => (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2" data-field-error={Boolean(visibleErrors.practicesPerWeek) || undefined}>
          <Label htmlFor="practices-per-week">Practices per week</Label>
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="practices-per-week"
              type="number"
              inputMode="numeric"
              min={1}
              max={7}
              value={draft.practicesPerWeek}
              placeholder="3"
              className="h-12 pl-10"
              onChange={(event) => setDraftFields({ practicesPerWeek: event.target.value })}
              aria-invalid={Boolean(visibleErrors.practicesPerWeek)}
            />
          </div>
          <FieldError message={visibleErrors.practicesPerWeek} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="practice-duration">Default practice duration</Label>
          <Select value={draft.defaultPracticeDuration} onValueChange={(defaultPracticeDuration) => setDraftFields({ defaultPracticeDuration })}>
            <SelectTrigger id="practice-duration" className="h-12"><SelectValue placeholder="Choose a duration" /></SelectTrigger>
            <SelectContent>
              {[45, 60, 75, 90, 120].map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes} minutes</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="court-availability">Court or space availability</Label>
          <Select value={draft.courtAvailability} onValueChange={(courtAvailability) => setDraftFields({ courtAvailability })}>
            <SelectTrigger id="court-availability" className="h-12"><SelectValue placeholder="Choose your usual setup" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="half-court">Half court</SelectItem>
              <SelectItem value="full-court">Full court</SelectItem>
              <SelectItem value="multiple-courts">Multiple courts</SelectItem>
              <SelectItem value="outdoor">Outdoor or flexible space</SelectItem>
              <SelectItem value="varies">Varies by practice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="basket-count">Available baskets</Label>
          <Select value={draft.basketCount} onValueChange={(basketCount) => setDraftFields({ basketCount })}>
            <SelectTrigger id="basket-count" className="h-12"><SelectValue placeholder="Choose a number" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 basket</SelectItem>
              <SelectItem value="2">2 baskets</SelectItem>
              <SelectItem value="3">3 baskets</SelectItem>
              <SelectItem value="4+">4 or more baskets</SelectItem>
              <SelectItem value="varies">Varies</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">Available equipment</h3>
          <p className="mt-1 text-sm text-muted-foreground">Select anything your team can use regularly.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {equipmentOptions.map((equipment) => (
            <ChoicePill key={equipment} selected={draft.equipment.includes(equipment)} onClick={() => toggleDraftArrayValue("equipment", equipment)}>
              {equipment}
            </ChoicePill>
          ))}
        </div>
      </section>
    </div>
  );

  const renderRoster = () => (
    <div className="space-y-4">
      {draft.players.length === 0 ? (
        <Button type="button" variant="outline" className="h-11 gap-2" onClick={addPlayer}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add player
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Name, position, and height are required. Jersey number is optional.</p>
      )}
      <div data-field-error={Boolean(visibleErrors.players) || undefined}>
        <FieldError message={visibleErrors.players} />
      </div>
      <div className="space-y-3">
        {draft.players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            index={index}
            errors={visibleErrors}
            expanded={expandedPlayers.has(player.id)}
            onExpandedChange={(open) => {
              setExpandedPlayers((current) => {
                const next = new Set(current);
                if (open) next.add(player.id);
                else next.delete(player.id);
                return next;
              });
            }}
            onChange={(updates) => updatePlayer(player.id, updates)}
            onRemove={() => removePlayer(player.id)}
          />
        ))}
      </div>
      {draft.players.length > 0 && (
        <Button type="button" variant="outline" className="h-11 w-full border-dashed" onClick={addPlayer}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add another player
        </Button>
      )}
    </div>
  );

  const renderReview = () => {
    const environmentItems = [
      draft.practicesPerWeek ? `${draft.practicesPerWeek} practices per week` : null,
      draft.defaultPracticeDuration ? `Default practice duration: ${draft.defaultPracticeDuration} minutes` : null,
      draft.courtAvailability ? draft.courtAvailability.replace(/-/g, " ") : null,
      draft.basketCount ? `${draft.basketCount} ${draft.basketCount === "1" ? "basket" : "baskets"}` : null,
    ].filter((item): item is string => Boolean(item));

    return (
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5">
              <div><CardTitle className="text-lg">Team</CardTitle><CardDescription>Identity and planning profile</CardDescription></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(0)}>Edit</Button>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0"><p className="truncate text-lg font-semibold">{draft.teamName.trim()}</p><p className="text-sm text-muted-foreground">Basketball · {draft.organization.trim() || "Independent"}</p></div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3"><dt className="text-muted-foreground">Age range</dt><dd className="mt-1 font-medium">{draft.ageRangeMin}–{draft.ageRangeMax}</dd></div>
                <div className="rounded-lg bg-muted/50 p-3"><dt className="text-muted-foreground">Team level</dt><dd className="mt-1 font-medium capitalize">{draft.teamLevel}</dd></div>
              </dl>
              {draft.practicePriorities.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Practice priorities</p>
                  <div className="flex flex-wrap gap-2">
                    {draft.practicePriorities.map((priority) => <span key={priority} className="max-w-full break-words rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{priority}</span>)}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1 text-sm font-medium">Coaching notes</p>
                <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{draft.coachingNotes.trim()}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)}>Edit team profile</Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5">
              <div><CardTitle className="text-lg">Practice setup</CardTitle><CardDescription>Typical environment and equipment</CardDescription></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>Edit</Button>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              {environmentItems.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {environmentItems.map((item) => <li key={item} className="flex items-center gap-2 capitalize"><Check className="h-4 w-4 text-primary" aria-hidden="true" />{item}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No practice defaults added yet.</p>}
              {draft.equipment.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {draft.equipment.map((equipment) => <span key={equipment} className="rounded-full border px-3 py-1 text-xs">{equipment}</span>)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5">
            <div><CardTitle className="text-lg">Roster</CardTitle><CardDescription>{draft.players.length} players ready to personalize practice plans</CardDescription></div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(3)}>Edit</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {draft.players.map((player) => (
                <div key={player.id} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
                  <div className="min-w-0"><p className="truncate font-medium">{player.name.trim()}</p><p className="text-xs text-muted-foreground">{player.jerseyNumber ? `#${Number(player.jerseyNumber)}` : "No jersey number"}</p></div>
                  <span className="w-fit rounded-full bg-muted px-2.5 py-1 font-medium">{player.position}</span>
                  <span className="text-muted-foreground">{formatPlayerHeight(player)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-secondary/35 bg-secondary/10 p-4 text-sm">
          <p className="font-semibold text-foreground">The UX is ready for the backend connection.</p>
          <p className="mt-1 text-muted-foreground">Create Team is intentionally disabled in this phase. This draft stays in memory while you review and edit it, and no account data is being written yet.</p>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (step === 0) return renderTeamIdentity();
    if (step === 1) return renderTeamProfile();
    if (step === 2) return renderPracticeEnvironment();
    if (step === 3) return renderRoster();
    return renderReview();
  };

  const nextLabel = step === 3 ? "Review team" : step === 4 ? "Create Team" : "Continue";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-4 sm:space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 shadow-sm sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none sm:text-3xl">
            {stepTitles[step]}
          </h1>
          <p className="shrink-0 text-sm font-medium text-muted-foreground">
            Step {step + 1} of {CREATE_TEAM_STEP_COUNT}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm"><CardContent className="p-4 sm:p-6 lg:p-8">{renderStep()}</CardContent></Card>

      <div className="hidden items-center justify-between rounded-xl border bg-background p-3 shadow-sm md:flex">
        <Button type="button" variant="ghost" className="h-11 gap-2" disabled={step === 0} onClick={goBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
        <div className="text-center">{step === 4 && <p className="text-xs text-muted-foreground">Backend connection comes next</p>}</div>
        <Button type="button" className="h-11 min-w-36 gap-2" disabled={step === 4} onClick={goNext}>
          {nextLabel}
          {step < 4 ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground md:hidden">
        {step === 4 ? "Backend connection comes next" : "Use Back and Continue below to move through setup."}
      </p>
    </div>
  );
};

export default Onboarding;
