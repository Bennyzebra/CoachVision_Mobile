export type AppRole = "coach" | "org_admin" | "platform_admin";

export interface CoachProfile {
  id: string;
  user_id: string;
  display_name: string;
  org?: string;
  sports: string[];
  location?: string;
  bio?: string;
  years_experience: number;
  badges: string[];
  is_public: boolean;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export type ItemType = "drill" | "plan";
export type Visibility = "public" | "followers" | "private";
export type ItemStatus = "active" | "flagged" | "removed";

export interface SharedItem {
  id: string;
  owner_user_id: string;
  item_type: ItemType;
  visibility: Visibility;
  title: string;
  summary?: string;
  tags: string[];
  age_levels: string[];
  skill_focus: string[];
  duration_mins?: number;
  equipment: string[];
  media: Array<{
    type: "image" | "video" | "diagram";
    url: string;
  }>;
  source_ref?: {
    type: string;
    id: string;
  };
  attribution?: {
    original_item_id: string;
    original_author_user_id: string;
  };
  sponsored: boolean;
  sponsor_meta?: {
    name: string;
    logo_url: string;
    link: string;
    expires_at: string;
  };
  views_count: number;
  saves_count: number;
  forks_count: number;
  used_in_plans_count: number;
  rating?: number;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  owner_profile?: CoachProfile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  item_id: string;
  user_id: string;
  text: string;
  status: "active" | "hidden";
  created_at: string;
  user_profile?: CoachProfile;
}

export interface Report {
  id: string;
  item_id: string;
  reporter_user_id: string;
  reason: string;
  status: "open" | "reviewed" | "removed";
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}
