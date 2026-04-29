import { supabase } from '@/integrations/supabase/client';
import { Drill, PlanItem } from '@/types';
import type { PostgrestError, User } from '@supabase/supabase-js';
export interface DbDrill {
  id: string;
  coach_id: string;
  name: string;
  focus?: string | null;
  category?: string | null;
  duration?: number | null;  
  duration_min?: number | null;  
  description: string;
  cues: string[] | null;
  tags?: string[] | null;
  focus_tags?: string[] | null;
  rating: number | null;
  verified: boolean | null;
  intensity: number | null;
  level: string | null;
  min_players: number | null;
  max_players: number | null;
  optimal_group_size: number | null;
  positions_emphasis: Record<string, number> | null;
  requires_full_court: boolean | null;
  media_url: string | null;
  is_template: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DbPracticePlan {
  id: string;
  coach_id: string;
  team_id: string | null;
  name: string;
  date: string;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}



export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    'code' in error &&
    'details' in error
  );
}

export function formatSupabaseError(error: unknown): string {
  if (isPostgrestError(error)) {
    const parts = [
      error.code ? `code=${error.code}` : null,
      error.message ? `message=${error.message}` : null,
      error.details ? `details=${error.details}` : null,
      error.hint ? `hint=${error.hint}` : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' | ') : 'Unknown Supabase error';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export interface DbPracticePlanItem {
  id: string;
  practice_plan_id: string;
  drill_id: string;
  order_index: number;
  duration: number;
  notes: string | null;
  groups: Array<{ size: number; label: string }>;
}

function dbDrillToDrill(dbDrill: DbDrill): Drill {
  const durationValue =
    (typeof dbDrill.duration_min === 'number' ? dbDrill.duration_min : null) ??
    dbDrill.duration ??
    0;
  
  return {
    id: dbDrill.id,
    name: dbDrill.name,
    focus: ((dbDrill.focus ?? dbDrill.category ?? 'offense') as Drill["focus"]),
    duration: durationValue,
    rating: dbDrill.rating ?? 0,
    verified: dbDrill.verified ?? false,
    description: dbDrill.description ?? "",
    cues: dbDrill.cues ?? [],
    tags: dbDrill.tags ?? dbDrill.focus_tags ?? [],
    intensity: dbDrill.intensity ?? undefined,
    level: dbDrill.level ?? undefined,
    minPlayers: dbDrill.min_players ?? undefined,
    maxPlayers: dbDrill.max_players ?? undefined,
    optimalGroupSize: dbDrill.optimal_group_size ?? undefined,
    positionsEmphasis: (dbDrill.positions_emphasis as Drill["positionsEmphasis"]) ?? undefined,
    requiresFullCourt: dbDrill.requires_full_court ?? undefined,
    mediaUrl: dbDrill.media_url ?? undefined,
  };
}

function drillToDbDrill(drill: Omit<Drill, 'id'>, coachId: string): Omit<DbDrill, 'id' | 'created_at' | 'updated_at'> {
    const positionsEmphasis = drill.positionsEmphasis
    ? Object.fromEntries(
        Object.entries(drill.positionsEmphasis).filter(
          ([position, value]) => ['G', 'F', 'C'].includes(position) && typeof value === 'number'
        )
      )
    : null;

  return {
    coach_id: coachId,
    name: drill.name.trim(),
    focus: drill.focus,
    duration: drill.duration,
    duration_min: drill.duration,    
    description: drill.description.trim(),
    cues: drill.cues?.map((cue) => cue.trim()).filter(Boolean) ?? [],
    tags: drill.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    rating: drill.rating ?? 0,
    verified: drill.verified ?? false,
    intensity: drill.intensity ?? null,
    ...(drill.level !== undefined ? { level: drill.level } : {}),
    min_players: drill.minPlayers ?? null,
    max_players: drill.maxPlayers ?? null,
    optimal_group_size: drill.optimalGroupSize ?? null,
    positions_emphasis: positionsEmphasis,
    requires_full_court: drill.requiresFullCourt ?? false,
    media_url: drill.mediaUrl?.trim() || null,
    is_template: false,
  };
}


function getNormalizedDrillPayload(drill: Omit<Drill, 'id'>, coachId: string): Record<string, unknown> {
  return { ...drillToDbDrill(drill, coachId) };
}

async function ensureProfileExists(user: User) {
  const { data: existingProfile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (existingProfile) return;

  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? null,
      coach_name: 'Coach',
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
}
export const drillService = {
  isSchemaMismatchForColumn(error: unknown, columnName: string): boolean {
  const errorText = formatSupabaseError(error);
    return (
      errorText.includes(columnName) &&
      (
        errorText.includes('PGRST204') ||
        errorText.includes('PGRST205') ||        
        errorText.includes('could not find column') ||
              errorText.includes('Could not find the') ||  
        errorText.includes('column') ||
        errorText.includes('schema cache')
      )
    );
  },

  getDurationFallbackPayload(
    payload: Record<string, unknown>,
    error: unknown,
  ): Record<string, unknown> | null {
    const fallbackPayload = { ...payload };
    let changed = false;

    if (this.isSchemaMismatchForColumn(error, 'focus') && 'focus' in fallbackPayload) {
      fallbackPayload.category = fallbackPayload.focus;
      delete fallbackPayload.focus;
      changed = true;
    }

    if (this.isSchemaMismatchForColumn(error, 'tags') && 'tags' in fallbackPayload) {
      fallbackPayload.focus_tags = fallbackPayload.tags;
      delete fallbackPayload.tags;
      changed = true;
    }

    if (this.isSchemaMismatchForColumn(error, 'duration')) {
      delete fallbackPayload.duration;
      changed = true;
    }

    if (this.isSchemaMismatchForColumn(error, 'duration_min')) {
      delete fallbackPayload.duration_min;
      changed = true;
    }

    return changed ? fallbackPayload : null;
  },
  
  async insertDrillWithDurationFallback(dbDrill: Record<string, unknown>): Promise<DbDrill> {
    const attempts: Record<string, unknown>[] = [{ ...dbDrill }];

    for (let index = 0; index < attempts.length; index += 1) {
      const attemptPayload = attempts[index];
      const { data, error } = await supabase
        .from('drills')
        .insert(attemptPayload as never)
        .select()
        .single();

      if (!error) return data as DbDrill;

      const fallbackPayload = this.getDurationFallbackPayload(attemptPayload, error);
      if (fallbackPayload) {
        const alreadyQueued = attempts.some(
          (attempt) => JSON.stringify(attempt) === JSON.stringify(fallbackPayload)
        );
        if (!alreadyQueued) {
          attempts.push(fallbackPayload);
          continue;
        }
      }

      throw new Error(`submitDrill failed: ${formatSupabaseError(error)}`);
    }

    throw new Error('submitDrill failed: no insert attempts executed');
  },

  async fetchDrills(): Promise<Drill[]> {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase
    .from('drills')
      .select('*')
      .order('name');

    if (user) {
      query = query.or(`verified.eq.true,coach_id.eq.${user.id}`);
    } else {
      query = query.eq('verified', true);
    }

    const { data, error } = await query;
    
    if (error) throw new Error(`fetchDrills failed: ${formatSupabaseError(error)}`);
    return (data || []).map(dbDrillToDrill);
  },

  async createDrill(drill: Omit<Drill, 'id'>): Promise<Drill> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await ensureProfileExists(user);
    
    const dbDrill = getNormalizedDrillPayload(drill, user.id);
    const data = await this.insertDrillWithDurationFallback(dbDrill);
    return dbDrillToDrill(data);
  },

  async submitDrill(drill: Omit<Drill, 'id'>): Promise<Drill> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await ensureProfileExists(user);
    
    const dbDrill = {
      ...getNormalizedDrillPayload(drill, user.id),
      verified: false,
    };

    const data = await this.insertDrillWithDurationFallback(dbDrill);
    return dbDrillToDrill(data);
  },

  async fetchModerationQueue(): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .eq('verified', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbDrillToDrill);
  },
  
  async updateDrill(id: string, updates: Partial<Drill>): Promise<Drill> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: Partial<DbDrill> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.focus !== undefined) dbUpdates.focus = updates.focus;
      if (updates.duration !== undefined) {
        dbUpdates.duration = updates.duration;
        (dbUpdates as Record<string, unknown>).duration_min = updates.duration;
      }
    if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags ?? null;
      if (updates.cues !== undefined) dbUpdates.cues = updates.cues ?? null;
      if (updates.intensity !== undefined) dbUpdates.intensity = updates.intensity ?? null;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.minPlayers !== undefined) dbUpdates.min_players = updates.minPlayers ?? null;
      if (updates.maxPlayers !== undefined) dbUpdates.max_players = updates.maxPlayers ?? null;
      if (updates.optimalGroupSize !== undefined) dbUpdates.optimal_group_size = updates.optimalGroupSize ?? null;
      if (updates.positionsEmphasis !== undefined) {
        dbUpdates.positions_emphasis = (updates.positionsEmphasis as Record<string, number>) ?? null;
      }
      if (updates.requiresFullCourt !== undefined) dbUpdates.requires_full_court = updates.requiresFullCourt ?? null;
      if (updates.mediaUrl !== undefined) dbUpdates.media_url = updates.mediaUrl ?? null;
    
    const attempts: Record<string, unknown>[] = [dbUpdates as Record<string, unknown>];

    for (let index = 0; index < attempts.length; index += 1) {
      const attemptPayload = attempts[index];
      const { data, error } = await supabase
        .from('drills')
        .update(attemptPayload as never)
        .eq('id', id)
        .select()
        .single();

      if (!error) return dbDrillToDrill(data);

      const fallbackPayload = this.getDurationFallbackPayload(attemptPayload, error);
      if (fallbackPayload) {
        const alreadyQueued = attempts.some(
          (attempt) => JSON.stringify(attempt) === JSON.stringify(fallbackPayload)
        );
        if (!alreadyQueued) {
          attempts.push(fallbackPayload);
          continue;
        }
      }
      
      throw new Error(`updateDrill failed: ${formatSupabaseError(error)}`);
    }

    throw new Error('updateDrill failed: no update attempts executed');
  },

  async deleteDrill(id: string): Promise<void> {
    const { error } = await supabase
      .from('drills')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async savePracticePlan(
    name: string,
    date: Date,
    planItems: PlanItem[],
    teamId?: string,
    notes?: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: plan, error: planError } = await supabase
      .from('practice_plans')
      .insert({
        coach_id: user.id,
        team_id: teamId || null,
        name,
        date: date.toISOString().split('T')[0],
        notes: notes || null,
        completed: false,
      })
      .select()
      .single();

    if (planError) throw planError;

    const itemsToInsert = planItems.map((item, index) => ({
      practice_plan_id: plan.id,
      drill_id: item.drillId,
      order_index: index,
      duration: item.duration,
      notes: item.notes || null,
      groups: item.groups || [],
    }));

    const { error: itemsError } = await supabase
      .from('practice_plan_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return plan.id;
  },

  async fetchPracticePlans(): Promise<DbPracticePlan[]> {
    const { data, error } = await supabase
      .from('practice_plans')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async fetchPracticePlan(planId: string): Promise<{ plan: DbPracticePlan; items: PlanItem[] }> {
    const { data: plan, error: planError } = await supabase
      .from('practice_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) throw planError;

    const { data: items, error: itemsError } = await supabase
      .from('practice_plan_items')
      .select('*')
      .eq('practice_plan_id', planId)
      .order('order_index');

    if (itemsError) throw itemsError;

    const planItems: PlanItem[] = (items || []).map(item => ({
      drillId: item.drill_id,
      duration: item.duration,
      notes: item.notes || undefined,
      groups: item.groups as any,
    }));

    return { plan, items: planItems };
  },

  async updatePracticePlan(
    planId: string,
    updates: { name?: string; date?: Date; notes?: string; completed?: boolean }
  ): Promise<void> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString().split('T')[0];
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

    const { error } = await supabase
      .from('practice_plans')
      .update(dbUpdates)
      .eq('id', planId);

    if (error) throw error;
  },

  async deletePracticePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('practice_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  },

  async saveFeedback(
    drillId: string,
    mood: 'happy' | 'meh' | 'sad',
    comment?: string,
    practicePlanId?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('drill_feedback')
      .insert({
        coach_id: user.id,
        drill_id: drillId,
        practice_plan_id: practicePlanId || null,
        mood,
        comment: comment || null,
      });

    if (error) throw error;
  },
};
