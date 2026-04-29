export type DrillFocus = "offense" | "defense" | "passing" | "conditioning";
export type Position = "G" | "F" | "C";
export type Experience = "beginner" | "intermediate" | "advanced";
export type DrillFeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface Drill {
  id: string;
  name: string;
  focus: DrillFocus;
  duration: number;
  rating: number;
  verified?: boolean;
  description: string;
  cues?: string[];
  tags?: string[];
  mediaUrl?: string;
  explainWhy?: string;  
  // Optional advanced planning fields
  minPlayers?: number;
  maxPlayers?: number;
  optimalGroupSize?: number;
  level?: Experience;
  intensity?: 1 | 2 | 3 | 4 | 5;
  positionsEmphasis?: Partial<Record<Position, number>>;
  requiresFullCourt?: boolean;
}

export interface PlanItem {
  drillId: string;
  duration: number;
  notes?: string;
  explainWhy?: string;  
  groups?: Array<{ size: number; label: string }>;
  segment?: "warmup" | "main" | "cooldown";  
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  height: string;
  experience?: Experience;
  attendance?: number[];
}

export interface FeedbackItem {
  drillId: string;
 rating: DrillFeedbackRating;
  notes?: string;
}

export interface PracticeFeedback {
  dateISO: string;
  items: FeedbackItem[];
  practiceNotes?: string;
  summary?: string;
}

export type IntensityPreference = "light" | "balanced" | "high";

export interface NotificationPreferences {
  practiceReminders: boolean;
  feedbackReminders: boolean;
  newSuggestions: boolean;
  teamUpdates: boolean;
  marketing: boolean;
}

export interface FocusDistribution {
  offense: number;
  defense: number;
  conditioning: number;
}

export interface Profile {
  sessionTarget: number;
  experience: Experience;
  hideAddedByDefault?: boolean;
  coachName?: string;
  email?: string;
  sport?: string;
  organization?: string;
  defaultPracticeLength?: number;
  defaultWarmupLength?: number;
  intensityPreference?: IntensityPreference;
  focusDistribution?: FocusDistribution;
  showAdvancedDrills?: boolean;
  showCommunityDrills?: boolean;
  notifications?: NotificationPreferences;
  planName?: string;
  renewalDate?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface AppState {
  drills: Drill[];
  plan: PlanItem[];
  players: Player[];
  feedback: PracticeFeedback[];
  profile: Profile;
  moderationQueue: Drill[];
  teams: Team[];
  currentTeamId: string;
}
