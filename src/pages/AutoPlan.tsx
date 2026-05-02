import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Users,
  AlertTriangle,
  UserPlus,
  Zap,
  Loader2,
  Search,
  RefreshCw,
  Pencil,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "@/contexts/TeamContext";
import { DrillFeedbackRating, IntensityPreference, Drill } from "@/types";
import { demoDrills } from "@/lib/demoData";
import {
  getPreloadedPlayers,
  loadAutoPlanPlayers,
} from "@/lib/autoplanPreload";
import {
  buildPracticePlan,
  computeStats,
  type DrillMeta,
  type SessionContext,
  type TeamDrillOutcome,  
} from "@/lib/planning/engine";
import {
  buildTeamProfile,
  type TeamProfileSummary,
} from "@/lib/planning/teamProfile";
import {
  generateDrillExplainWhys,
  generatePracticePlan,
  summarizeIntentForPlanning,
  type PlanningIntent,
} from "@/services/geminiService";
import { GeneratedPlan } from "@/components/GeneratedPlan";
import { getTeamDrillOutcomes, savePractice } from "@/services/practiceService";
import { useAuth } from "@/contexts/AuthContext";

const focusAreas = ["offense", "defense", "conditioning"] as const;
type FocusArea = (typeof focusAreas)[number];

const GENERATED_PLAN_STORAGE_KEY = "coachvision-auto-plan-generated";
const GENERATED_PLAN_TITLE_STORAGE_KEY = "coachvision-auto-plan-title";
const MIN_PRACTICE_DURATION = 10;
const MAX_PRACTICE_DURATION = 240;

const clampPracticeDuration = (value: number) =>
  Math.min(MAX_PRACTICE_DURATION, Math.max(MIN_PRACTICE_DURATION, value));

// Extended focus options for the new UI
const focusOptions = [
  { id: "offense", label: "Offense", iconSrc: "/focus-icons/offense.svg", iconAlt: "Offense" },
  { id: "defense", label: "Defense", iconSrc: "/focus-icons/defense.svg", iconAlt: "Defense" },
  { id: "passing", label: "Passing", iconSrc: "/focus-icons/passing.svg", iconAlt: "Passing" },
  {
    id: "conditioning",
    label: "Conditioning",
    iconSrc: "/focus-icons/conditioning.svg",
    iconAlt: "Conditioning",
  },
  { id: "shooting", label: "Shooting", iconSrc: "/focus-icons/shooting.svg", iconAlt: "Shooting" },
  {
    id: "ball-movement",
    label: "Ball Movement",
    iconSrc: "/focus-icons/ball-movement.svg",
    iconAlt: "Ball movement",
  },
] as const;

type FocusOption = (typeof focusOptions)[number]["id"];

const focusKeywordMap: Record<string, FocusOption> = {
  offense: "offense",
  offensive: "offense",
  defense: "defense",
  defensive: "defense",
  conditioning: "conditioning",
  cardio: "conditioning",
  passing: "passing",
  "ball-movement": "ball-movement",
  ball: "ball-movement",
  movement: "ball-movement",
  shooting: "shooting",
  shot: "shooting",
};

const normalizeFocusDistribution = (
  distribution: Record<FocusArea, number>
): Record<FocusArea, number> => {
  const total = focusAreas.reduce((sum, key) => sum + (Number(distribution[key]) || 0), 0);

  if (total <= 0) {
    return { offense: 40, defense: 40, conditioning: 20 };
  }

  const normalized = {} as Record<FocusArea, number>;
  let remaining = 100;

  focusAreas.forEach((area, index) => {
    if (index === focusAreas.length - 1) {
      normalized[area] = Math.max(0, remaining);
      return;
    }

    const raw = ((Number(distribution[area]) || 0) / total) * 100;
    const rounded = Math.max(0, Math.round(raw));
    normalized[area] = rounded;
    remaining -= rounded;
  });

  return normalized;
};

const AutoPlan = () => {
  const { state, setPlan, setDrills } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();  
  const { currentTeam, teams } = useTeam();
  const { user } = useAuth();
  const [goals, setGoals] = useState("");
  const [goalsManuallyEdited, setGoalsManuallyEdited] = useState(false);
  const [players, setPlayers] = useState<SessionContext["attending"]>([]);
  const [selectedFocuses, setSelectedFocuses] = useState<FocusOption[]>(["offense", "defense"]);
  const [primaryFocus, setPrimaryFocus] = useState<FocusOption | null>("offense");
  const [teamDrillOutcomes, setTeamDrillOutcomes] = useState<Record<string, TeamDrillOutcome>>({});  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState("");
  const [practiceTitleDraft, setPracticeTitleDraft] = useState("");
  const [isTitleSheetOpen, setIsTitleSheetOpen] = useState(false);  
  const [generatedPlan, setGeneratedPlan] = useState<{
    warmup: Drill[];
    main_segment: Drill[];
    cool_down: Drill[];
    coach_notes: string;
  } | null>(null);
   
  // Search-driven planning state
  const [searchText, setSearchText] = useState("");
  const [isParsingIntent, setIsParsingIntent] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<PlanningIntent | null>(null);
  const [showApplyFromSearch, setShowApplyFromSearch] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const drillOutcomesUnavailableLoggedRef = useRef(false);
  
  const normalizedDefaults = useMemo(
    () => ({
      defaultPracticeLength:
        Number(state.profile.defaultPracticeLength ?? state.profile.sessionTarget ?? 60) || 60,
      defaultWarmupLength: Number(state.profile.defaultWarmupLength ?? 15) || 15,
      intensityPreference: (state.profile.intensityPreference || "balanced") as IntensityPreference,
      focusDistribution: normalizeFocusDistribution({
        offense: Number(state.profile.focusDistribution?.offense ?? 40) || 40,
        defense: Number(state.profile.focusDistribution?.defense ?? 40) || 40,
        conditioning: Number(state.profile.focusDistribution?.conditioning ?? 20) || 20,
      }),
      hideAddedByDefault: state.profile.hideAddedByDefault ?? false,
      showAdvancedDrills: state.profile.showAdvancedDrills ?? true,
      showCommunityDrills: state.profile.showCommunityDrills ?? true,
    }),
    [state.profile]
  );

  const [duration, setDuration] = useState<number>(
    clampPracticeDuration(normalizedDefaults.defaultPracticeLength)
  );
  const [durationDraft, setDurationDraft] = useState(
    String(clampPracticeDuration(normalizedDefaults.defaultPracticeLength))
  );
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [practiceDefaults, setPracticeDefaults] = useState(normalizedDefaults);

 const [lastProcessedQuery, setLastProcessedQuery] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPlan = window.sessionStorage.getItem(GENERATED_PLAN_STORAGE_KEY);
    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan);
        setGeneratedPlan(parsedPlan);
      } catch (error) {
        console.error("Failed to parse stored generated plan", error);
        window.sessionStorage.removeItem(GENERATED_PLAN_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTitle = window.sessionStorage.getItem(GENERATED_PLAN_TITLE_STORAGE_KEY);
  if (storedTitle) {
      setPracticeTitle(storedTitle);
      setPracticeTitleDraft(storedTitle);
    }
  }, []);
    
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (generatedPlan) {
      window.sessionStorage.setItem(
        GENERATED_PLAN_STORAGE_KEY,
        JSON.stringify(generatedPlan)
      );
    } else {
      window.sessionStorage.removeItem(GENERATED_PLAN_STORAGE_KEY);
    }
  }, [generatedPlan]); 
  
  useEffect(() => {

    if (typeof window === "undefined") return;

    if (practiceTitle.trim()) {
      window.sessionStorage.setItem(GENERATED_PLAN_TITLE_STORAGE_KEY, practiceTitle.trim());
    } else {
      window.sessionStorage.removeItem(GENERATED_PLAN_TITLE_STORAGE_KEY);
    }
  }, [practiceTitle]);    

  useEffect(() => {
    setPracticeDefaults(normalizedDefaults);
    const nextDuration = clampPracticeDuration(normalizedDefaults.defaultPracticeLength);
    setDuration(nextDuration);
    setDurationDraft(String(nextDuration));
  }, [normalizedDefaults]);

  useEffect(() => {
    if (!isEditingDuration) {
      setDurationDraft(String(duration));
    }
  }, [duration, isEditingDuration]);
  
  useEffect(() => {
    const query = searchParams.get("query");
    
    // Skip if we've already processed this exact query
    if (query === lastProcessedQuery) return;
    
    if (!query) {
      setLastProcessedQuery(null);
      return;
    }

    // Mark this query as being processed
    setLastProcessedQuery(query);
    // Set the search text to display in the search input
    setSearchText(query);
 
    // Show loading state in the AutoPlan search bar
    setIsParsingIntent(true);
    
    const tokens = query
      .toLowerCase()
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const matchedFocuses: FocusOption[] = [];
    const unmatchedTokens: string[] = [];

    tokens.forEach((token) => {
      const matchedFocus = focusKeywordMap[token];
      if (matchedFocus) {
        if (!matchedFocuses.includes(matchedFocus)) {
          matchedFocuses.push(matchedFocus);
        }
      } else {
        unmatchedTokens.push(token);
      }
    });

    if (matchedFocuses.length > 0) {
      setSelectedFocuses((prev) => {
        const merged = Array.from(new Set([...prev, ...matchedFocuses])) as FocusOption[];
        return merged;
      });
      setPrimaryFocus(matchedFocuses[0]);
    }

    // Use the new summarizeIntentForPlanning for better intent parsing
    const fetchIntent = async () => {
      try {
        // Use the enhanced planning intent
        const planningIntent = await summarizeIntentForPlanning(query);
        setParsedIntent(planningIntent);


        // Map intent focuses to our FocusOption type
        const mapFocus = (focus: string): FocusOption | null => {
          const normalized = focus.toLowerCase().replace(/\s+/g, "-");
          const mapping: Record<string, FocusOption> = {
            offense: "offense",
            defense: "defense",
            passing: "passing",
            conditioning: "conditioning",
            shooting: "shooting",
            "ball-movement": "ball-movement",
            "ball movement": "ball-movement",
          };
          return mapping[normalized] || null;
        };

        const primaryMapped = mapFocus(planningIntent.primary_focus);
        const secondaryMapped = planningIntent.secondary_focuses
          .map(mapFocus)
          .filter((f): f is FocusOption => f !== null);        

        if (primaryMapped) {
          const newFocuses: FocusOption[] = [primaryMapped, ...secondaryMapped];
          setSelectedFocuses(prev => {
            const merged = Array.from(new Set([...newFocuses]));
            return merged.length > 0 ? merged : prev;        
          });
          setPrimaryFocus(primaryMapped);
        }

        // Set goals if empty and not manually edited
        if (planningIntent.suggested_goals) {
          const trimmedGoal = planningIntent.suggested_goals.trim();
          if (trimmedGoal) {
           if (!goals.trim() && !goalsManuallyEdited) {
              setGoals(trimmedGoal);
            } else if (goals.trim()) {
              // Show apply option if goals already exist
              setShowApplyFromSearch(true);
            }
          }
        }
      } catch (error) {
        console.error("Planning intent parsing failed, using fallback:", error);
                
        if (unmatchedTokens.length > 0) {
          const unmatchedText = unmatchedTokens.join(" ");
          setGoals((prev) => (prev ? `${prev}\n${unmatchedText}` : unmatchedText));
        }
      } finally {
        setIsParsingIntent(false);
      }
    };

    fetchIntent();
 }, [searchParams, lastProcessedQuery, goals, goalsManuallyEdited]);

  // Debounced search intent parsing (700-1000ms after typing stops or on Enter)
  const parseSearchIntentDebounced = useCallback(async (text: string) => {
    if (!text.trim()) {
      setParsedIntent(null);
      setShowApplyFromSearch(false);
      return;
    }

    setIsParsingIntent(true);
    try {
      const intent = await summarizeIntentForPlanning(text);
      setParsedIntent(intent);

      // Map intent focuses to our FocusOption type
      const mapFocus = (focus: string): FocusOption | null => {
        const normalized = focus.toLowerCase().replace(/\s+/g, "-");
        const mapping: Record<string, FocusOption> = {
          offense: "offense",
          defense: "defense",
          passing: "passing",
          conditioning: "conditioning",
          shooting: "shooting",
          "ball-movement": "ball-movement",
          "ball movement": "ball-movement",
        };
        return mapping[normalized] || null;
      };

      // Update focus chips based on parsed intent
      const primaryMapped = mapFocus(intent.primary_focus);
      const secondaryMapped = intent.secondary_focuses
        .map(mapFocus)
        .filter((f): f is FocusOption => f !== null);

      if (primaryMapped) {
        const newFocuses: FocusOption[] = [primaryMapped, ...secondaryMapped];
        setSelectedFocuses(prev => {
          const merged = Array.from(new Set([...newFocuses]));
          return merged.length > 0 ? merged : prev;
        });
        setPrimaryFocus(primaryMapped);
      }

      // Auto-fill goals if empty and not manually edited
      if (!goals.trim() && !goalsManuallyEdited && intent.suggested_goals) {
        setGoals(intent.suggested_goals);
      } else if (goals.trim() && intent.suggested_goals) {
        // Show option to apply from search
        setShowApplyFromSearch(true);
      }

    } catch (error) {
      console.error("Failed to parse search intent:", error);
    } finally {
      setIsParsingIntent(false);
    }
  }, [goals, goalsManuallyEdited]);

  // Handle search text changes with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!searchText.trim()) {
      setParsedIntent(null);
      setShowApplyFromSearch(false);
      return;
    }

    // Set a new debounce timeout (800ms)
    debounceTimeoutRef.current = setTimeout(() => {
      parseSearchIntentDebounced(searchText);
    }, 800);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchText, parseSearchIntentDebounced]);

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Clear any pending debounce and trigger immediately
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      parseSearchIntentDebounced(searchText);
    }
  };

  // Apply suggested goals from search
  const handleApplyGoalsFromSearch = () => {
    if (parsedIntent?.suggested_goals) {
      setGoals(parsedIntent.suggested_goals);
      setShowApplyFromSearch(false);
      toast.success("Goals updated from search intent");
    }
  };

  // Track manual goal edits
  const handleGoalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGoals(e.target.value);
    if (e.target.value.trim()) {
      setGoalsManuallyEdited(true);
    }
  };

  const commitDurationDraft = () => {
    const parsedDuration = Number.parseInt(durationDraft, 10);

    if (Number.isNaN(parsedDuration)) {
      setDurationDraft(String(duration));
      setIsEditingDuration(false);
      return;
    }

    const nextDuration = clampPracticeDuration(parsedDuration);
    setDuration(nextDuration);
    setDurationDraft(String(nextDuration));
    setIsEditingDuration(false);
  };

  const handleDurationInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDurationDraft();
    }

    if (event.key === "Escape") {
      setDurationDraft(String(duration));
      setIsEditingDuration(false);
    }
  };

  // Load players from current team
  useEffect(() => {
    const loadPlayers = async () => {
      if (!currentTeam) return;

      const cached = getPreloadedPlayers(currentTeam.id);
      if (cached) {
        setPlayers(cached);
        return;
      }
      const normalized = await loadAutoPlanPlayers(currentTeam.id);
      setPlayers(normalized);      
    };

    loadPlayers();
  }, [currentTeam]);

  useEffect(() => {
    if (!user || !currentTeam) return;

    const loadOutcomes = async () => {
      const { data, error, outcomesUnavailable } = await getTeamDrillOutcomes(user.id, currentTeam.id);
      if (error) {
        console.warn("Unable to load team drill outcomes:", error);
        return;
      }

      if (outcomesUnavailable && !drillOutcomesUnavailableLoggedRef.current) {
        console.info("Practice drill outcomes are unavailable in this environment until the migration is applied.");
        drillOutcomesUnavailableLoggedRef.current = true;
      }
      
      const outcomeMap = (data ?? []).reduce<Record<string, TeamDrillOutcome>>((acc, outcome) => {
        acc[outcome.drill_id] = {
          avgCompletionPercent: outcome.avg_completion_percent,
          avgFeedbackRating: outcome.avg_feedback_rating,
          totalSessions: outcome.total_sessions,
        };
        return acc;
      }, {});
      setTeamDrillOutcomes(outcomeMap);
    };

    loadOutcomes();
  }, [currentTeam, user]);
  
  const stats = useMemo(() => computeStats(players), [players]);

  const mapFeedbackToMood = (rating: DrillFeedbackRating): SessionContext["feedback"][number]["mood"] => {
    if (rating >= 4) return "happy";
    if (rating === 3) return "neutral";
    return "sad";
  };
  
   const toggleFocusSelection = (focusId: FocusOption) => {
    setSelectedFocuses((prev) => {
      if (prev.includes(focusId)) {
        // Don't allow removing all focuses
        if (prev.length === 1) return prev;
        // If removing primary, make another one primary
        if (primaryFocus === focusId) {
          const remaining = prev.filter((f) => f !== focusId);
          setPrimaryFocus(remaining[0] || null);
        }
        return prev.filter((f) => f !== focusId);
      } else {
        return [...prev, focusId];
      }
    });
  };

  const handleSetPrimaryFocus = (focusId: FocusOption) => {
    if (!selectedFocuses.includes(focusId)) {
      setSelectedFocuses((prev) => [...prev, focusId]);
    }
    setPrimaryFocus(focusId);
  };

  // Convert UI focus to engine focus
  const getEngineFocus = (): SessionContext["focus"] => {
    if (primaryFocus === "offense" || primaryFocus === "shooting") return "offense";
    if (primaryFocus === "defense") return "defense";
    if (primaryFocus === "passing" || primaryFocus === "ball-movement") return "passing";
    if (primaryFocus === "conditioning") return "conditioning";
    return "balanced";
  };

  const mapDrill = (d: Record<string, unknown>): Drill => ({
    id: d.id as string,
    name: d.name as string,
    focus: (d.focus || "offense") as Drill["focus"],
    duration: (d.duration || d.duration_min || 10) as number,
    rating: (d.rating || 0) as number,
    verified: (d.verified || false) as boolean,
    description: (d.description || "") as string,
    cues: (d.cues || []) as string[],
    tags: (d.tags || []) as string[],
    mediaUrl: d.media_url as string | undefined,
    minPlayers: d.min_players as number | undefined,
    maxPlayers: d.max_players as number | undefined,
    optimalGroupSize: d.optimal_group_size as number | undefined,
    level: d.level,
    intensity: d.intensity,
    positionsEmphasis: d.positions_emphasis,
    requiresFullCourt: d.requires_full_court,
  });
  
  const generatePlan = async () => {
    if (players.length === 0) {
      toast.error("Add players to your team first!");
      return;
    }

    if (state.plan.length > 0) {
      if (!confirm("This will clear your current plan. Continue?")) {
        return;
      }
    }

    setIsGenerating(true);

    let availableDrills: Drill[] = [];
    
    try {
      let drillsQuery = supabase
      .from('drills')
        .select('*');

      if (user) {
        drillsQuery = drillsQuery.or(`verified.eq.true,coach_id.eq.${user.id}`);
      } else {
        drillsQuery = drillsQuery.eq('verified', true);
      }

      const { data: drills, error } = await drillsQuery;
      
      if (error) throw error;

      availableDrills = (drills || []).map(mapDrill);
      
      const ageGroup = stats.majorityLevel || state.profile.experience || "intermediate";
      const focus = primaryFocus || "offense";

      const coachRequirements = {
        ageGroup,
        focus,
        duration,
        goals,
        coachId: user?.id,
        teamId: currentTeam?.id,        
      };

      const result = await generatePracticePlan(coachRequirements, availableDrills);

      const teamProfileSummary = currentTeam?.team_profile_summary as TeamProfileSummary | null | undefined;
      const explainWhyMap = await generateDrillExplainWhys({
        coachRequirements,
        teamProfileSummary,
        drills: [
          ...result.warmup.map((drill) => {
            const mapped = mapDrill(drill);
            return {
              id: mapped.id,
              name: mapped.name,
              focus: mapped.focus,
              duration: mapped.duration,
              segment: "warmup",
              tags: mapped.tags,
            };
          }),
          ...result.main_segment.map((drill) => {
            const mapped = mapDrill(drill);
            return {
              id: mapped.id,
              name: mapped.name,
              focus: mapped.focus,
              duration: mapped.duration,
              segment: "main",
              tags: mapped.tags,
            };
          }),
          ...result.cool_down.map((drill) => {
            const mapped = mapDrill(drill);
            return {
              id: mapped.id,
              name: mapped.name,
              focus: mapped.focus,
              duration: mapped.duration,
              segment: "cooldown",
              tags: mapped.tags,
            };
          }),
        ],
      });

      const mapDrillWithExplainWhy = (drill: Record<string, unknown>) => {
        const mapped = mapDrill(drill);
        const explainWhy = explainWhyMap[mapped.id];
        return { ...mapped, explainWhy };
      };
      
      setGeneratedPlan({
        warmup: result.warmup.map(mapDrillWithExplainWhy),
        main_segment: result.main_segment.map(mapDrillWithExplainWhy),
        cool_down: result.cool_down.map(mapDrillWithExplainWhy),
        coach_notes: result.coach_notes,
      });

      toast.success("Practice plan generated successfully!");
    } catch (error) {
      console.error("Error generating plan:", error);
      if (availableDrills.length > 0) {
        const teamProfileSummary = currentTeam?.team_profile_summary as TeamProfileSummary | null | undefined;
        const teamProfile = buildTeamProfile({
          attending: players,
          coachPreferences: {
            focusDistribution: practiceDefaults.focusDistribution,
            intensityPreference: practiceDefaults.intensityPreference,
          },
          summary: teamProfileSummary ?? null,
        });
        
        const sessionContext: SessionContext = {
          attending: players,
          focus: getEngineFocus(),
          goalsText: goals,
          teamLevel: stats.majorityLevel || "intermediate",
          duration,
          focusDistribution: practiceDefaults.focusDistribution,
          teamProfile,         
          teamDrillOutcomes,          
          lastUsedDrillIds: state.plan.map(item => item.drillId),
        };

        const fallbackPlan = buildPracticePlan(sessionContext, availableDrills);
        if (fallbackPlan.length > 0) {
          const drillLookup = new Map(availableDrills.map(drill => [drill.id, drill]));
          const warmup: Drill[] = [];
          const main_segment: Drill[] = [];
          const cool_down: Drill[] = [];

          fallbackPlan.forEach(item => {
            const drill = drillLookup.get(item.drillId);
            if (!drill) return;
            const drillWithDuration = { ...drill, duration: item.duration, explainWhy: item.explainWhy };
            if (item.segment === "warmup") warmup.push(drillWithDuration);
            else if (item.segment === "cooldown") cool_down.push(drillWithDuration);
            else main_segment.push(drillWithDuration);
          });

          const explainWhyMap = await generateDrillExplainWhys({
            coachRequirements,
            teamProfileSummary,
            drills: [
              ...warmup.map((drill) => ({
                id: drill.id,
                name: drill.name,
                focus: drill.focus,
                duration: drill.duration,
                segment: "warmup",
                tags: drill.tags,
              })),
              ...main_segment.map((drill) => ({
                id: drill.id,
                name: drill.name,
                focus: drill.focus,
                duration: drill.duration,
                segment: "main",
                tags: drill.tags,
              })),
              ...cool_down.map((drill) => ({
                id: drill.id,
                name: drill.name,
                focus: drill.focus,
                duration: drill.duration,
                segment: "cooldown",
                tags: drill.tags,
              })),
            ],
          });

          const applyExplainWhy = (drills: Drill[]) =>
            drills.map((drill) => ({ ...drill, explainWhy: explainWhyMap[drill.id] }));
          
          setGeneratedPlan({
            warmup: applyExplainWhy(warmup),
            main_segment: applyExplainWhy(main_segment),
            cool_down: applyExplainWhy(cool_down),
            coach_notes: "Generated locally based on your practice defaults.",
          });

          toast.warning("AI plan failed. Generated a local plan instead.");
          return;
        }
      }      
      const errorMessage = error instanceof Error ? error.message : "Failed to generate practice plan. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!generatedPlan || !user) {
      toast.error("Unable to save practice");
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await savePractice(
        user.id,
        currentTeam?.id || null,
        duration,
        generatedPlan,
        practiceTitle
      );

      if (error) throw error;

      if (data) {
        toast.success("Practice saved successfully!");
        navigate(`/run?practiceId=${data.id}`);
      }
    } catch (error) {
      console.error("Error saving practice:", error);
      toast.error("Failed to save practice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

 // Get last practice rating if available
  const lastPracticeRating = useMemo(() => {
    if (state.feedback.length === 0) return null;
    const lastFeedback = state.feedback[state.feedback.length - 1];
    const items = lastFeedback?.items || [];
    if (items.length === 0) return null;
    return (items.reduce((sum, i) => sum + i.rating, 0) / items.length).toFixed(1);
  }, [state.feedback]);

  // Empty state: No team created
  if (!currentTeam && teams.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-dashed border-muted-foreground/25">
          <CardContent className="py-16 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No Team Created</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Create your first team to start using Auto-Plan and generate AI-powered practice plans.
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={() => navigate("/settings")}>
              <UserPlus className="w-5 h-5" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state: Team exists but no players
  if (players.length === 0 && currentTeam) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardContent className="py-16 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-secondary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No Players Added</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Add players to your roster so Auto-Plan can create personalized drills based on positions, experience, and team composition.
              </p>
            </div>

            <Button size="lg" className="gap-2" onClick={() => navigate("/team")}>
              <UserPlus className="w-5 h-5" />
              Add Players to Roster
            </Button>
          </CardContent>
        </Card>
      </div>
 );
  }

  if (generatedPlan) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Sheet
              open={isTitleSheetOpen}
              onOpenChange={(open) => {
                setIsTitleSheetOpen(open);
                if (open) {
                  setPracticeTitleDraft(practiceTitle);
                }
              }}
            >
              <SheetTrigger asChild>
                <Button variant="outline" className="mb-3 h-11 w-full gap-2 sm:w-auto">
                  <Pencil className="h-4 w-4" />
                  {practiceTitle.trim() ? "Edit Practice Name" : "Name Practice"}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{practiceTitle.trim() ? "Edit Practice Name" : "Name Your Practice"}</SheetTitle>
                  <SheetDescription>
                    Add a title now and update it any time before saving.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="practiceTitle">Practice title</Label>
                    <Input
                      id="practiceTitle"
                      placeholder="e.g. Ball Movement + Transition Defense"
                      value={practiceTitleDraft}
                      onChange={(event) => setPracticeTitleDraft(event.target.value)}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setIsTitleSheetOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setPracticeTitle(practiceTitleDraft.trim());
                        setIsTitleSheetOpen(false);
                      }}
                    >
                      Save Title
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold leading-tight sm:text-3xl">
              <Sparkles className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
              {practiceTitle.trim() || "Your AI-Generated Practice Plan"}
            </h1>
            <p className="text-muted-foreground">
              Review your personalized practice plan
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={() => {
              setGeneratedPlan(null);
              setPracticeTitle("");
              setPracticeTitleDraft("");
              setIsTitleSheetOpen(false);
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(GENERATED_PLAN_TITLE_STORAGE_KEY);
              }              
            }}
            >
            Create New Plan
          </Button>
        </div>

        <GeneratedPlan
          plan={generatedPlan}
          onViewDrill={(drillId) => {
            navigate(`/drill/${drillId}`, { state: { fromAutoPlan: true } });
          }}
          onSaveAndContinue={handleSaveAndContinue}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
     {/* Search-Driven Planning */}
      <Card data-mobile-header-hide-anchor className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="What should we work on today?"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-12 bg-background pl-10 pr-10 text-base transition duration-200 ease-out hover:border-primary/40 hover:shadow-md hover:shadow-primary/20 sm:pr-4 sm:hover:scale-[1.01]"
                />
              {isParsingIntent && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
          {parsedIntent && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Detected:</span>
              <Badge variant="secondary" className="text-xs">
                {parsedIntent.primary_focus}
              </Badge>
              {parsedIntent.secondary_focuses.map((focus) => (
                <Badge key={focus} variant="outline" className="text-xs">
                  {focus}
                </Badge>
              ))}
              {parsedIntent.drill_keywords.slice(0, 3).map((kw) => (
                <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>      
      {/* Practice Configuration - AI Form Style */}
      <Card className="rounded-xl border-2">
        <CardHeader className="border-b bg-muted/30 p-3 sm:p-5">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <Zap className="h-5 w-5 text-primary" />
            Practice Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-3 sm:space-y-7 sm:p-5">
          {/* Step 1: Duration */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-base font-semibold">Practice Length</Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  {isEditingDuration ? (
                    <Input
                      autoFocus
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={durationDraft}
                      onBlur={commitDurationDraft}
                      onChange={(event) => setDurationDraft(event.target.value.replace(/\D/g, ""))}
                      onFocus={(event) => event.target.select()}
                      onKeyDown={handleDurationInputKeyDown}
                      aria-label="Practice length in minutes"
                      className="h-10 w-24 px-2 text-center text-2xl font-bold text-primary sm:text-3xl"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDurationDraft(String(duration));
                        setIsEditingDuration(true);
                      }}
                      className="rounded-md px-1 text-2xl font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-3xl"
                      aria-label="Edit practice length"
                    >
                      {duration}
                    </button>
                  )}
                  <span className="text-muted-foreground">minutes</span>
                </div>
              </div>
              <Slider
                value={[duration]}
                min={MIN_PRACTICE_DURATION}
                max={MAX_PRACTICE_DURATION}
                step={5}
                onValueChange={(value) => setDuration(clampPracticeDuration(value[0]))}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shorter</span>
                <span>Standard</span>
                <span>Longer</span>
              </div>
            </div>
          </div>

          {/* Step 2: Focus Areas */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <Label className="text-base font-semibold">Choose Focus Areas</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Select all that apply, then star one as your primary focus
                </p>
              </div>
            </div>
            <div>
              <div className="flex flex-col gap-2">
                {focusOptions.map((option) => {
                  const isSelected = selectedFocuses.includes(option.id);
                  const isPrimary = primaryFocus === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      className={`grid min-h-16 cursor-pointer grid-cols-[2rem_2rem_minmax(0,1fr)_3rem] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all sm:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_3rem] sm:gap-3 ${
                        isPrimary
                          ? "border-primary/60 bg-primary/10 shadow-sm"
                          : isSelected
                            ? "border-primary/30 bg-muted"
                            : "border-border bg-background"
                      }`}
                      onClick={() => toggleFocusSelection(option.id)}                      
                    >
                      <label
                        className="flex min-h-10 items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFocusSelection(option.id)}
                          className="h-5 w-5 shrink-0"
                          aria-label={`Select ${option.label} focus`}
                        />
                      </label>
                      <img
                        src={option.iconSrc}
                        alt={option.iconAlt}
                        className="h-6 w-6 shrink-0 justify-self-center sm:h-7 sm:w-7"
                        loading="lazy"
                      />
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {option.label}
                      </span>
                      <button
                        type="button"
                        className="group inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSetPrimaryFocus(option.id);
                        }}                        
                        aria-pressed={isPrimary}
                        aria-label={`Set ${option.label} as primary focus`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                            isPrimary
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary group-hover:bg-primary/5 group-hover:text-primary"
                          }`}
                        >
                          <Star className={`h-3 w-3 ${isPrimary ? "fill-current" : ""}`} />
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Goals */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-base font-semibold">Add Today's Goals</Label>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  placeholder="Fix turnovers, prep for the game on Friday, strengthen our defense..."
                  value={goals}
                  onChange={handleGoalsChange}
                  rows={3}
                  className="min-h-28 resize-none pb-14 sm:pb-3"
                />
                {showApplyFromSearch && parsedIntent?.suggested_goals && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 gap-1.5 text-xs sm:bottom-auto sm:top-2"
                    onClick={handleApplyGoalsFromSearch}
                  >
                    <Pencil className="h-3 w-3" />
                    Apply from search
                  </Button>
                )}
              </div>
              {showApplyFromSearch && parsedIntent?.suggested_goals && (
                <p className="text-xs text-muted-foreground">
                  Suggested: "{parsedIntent.suggested_goals}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="py-2 sm:py-4">
        <Button
          onClick={generatePlan}
          size="lg"
          disabled={isGenerating}
          className="h-12 w-full gap-2 bg-primary text-base shadow-md transition-all duration-300 hover:bg-primary/90 sm:h-14 sm:gap-3 sm:text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
              Generating Your Plan...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              Generate Practice Plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AutoPlan;
