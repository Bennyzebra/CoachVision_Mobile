import { useState, useEffect, useCallback } from "react";
import { AppState, PlanItem, Player, PracticeFeedback, Drill } from "@/types";
import { getDefaultState } from "@/lib/demoData";
import { drillService } from "@/lib/services/drillService";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "coachvision-state";

export const useAppState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getDefaultState();
      }
    }
    return getDefaultState();
  });
  const [drillsLoading, setDrillsLoading] = useState(false);
  const [drillsError, setDrillsError] = useState<string | null>(null);
    const [hasLoadedDrills, setHasLoadedDrills] = useState(() => state.drills.length > 0);

  const loadDrillsFromDatabase = useCallback(async () => {
        if (drillsLoading || hasLoadedDrills || state.drills.length > 0) {
      return;
    }
    try {
      setDrillsLoading(true);
      setDrillsError(null);
      const drills = await drillService.fetchDrills();
      setState(prev => ({ ...prev, drills }));
      setHasLoadedDrills(true);      
    } catch (error) {
      console.error('Failed to load drills:', error);
      setDrillsError(error instanceof Error ? error.message : 'Failed to load drills');
    } finally {
      setDrillsLoading(false);
    }
  }, [drillsLoading, hasLoadedDrills, state.drills.length]);
  
  useEffect(() => {
    if (user && state.drills.length === 0 && !hasLoadedDrills) {
    loadDrillsFromDatabase();
    }
  }, [user, state.drills.length, hasLoadedDrills, loadDrillsFromDatabase]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addToPlan = (drillId: string) => {
    const drill = state.drills.find((d) => d.id === drillId);
    if (!drill) return;
    
    setState((prev) => ({
      ...prev,
      plan: [...prev.plan, { drillId, duration: drill.duration }],
    }));
  };

  const removeFromPlan = (index: number) => {
    setState((prev) => ({
      ...prev,
      plan: prev.plan.filter((_, i) => i !== index),
    }));
  };

  const updatePlanItemDuration = (index: number, duration: number) => {
    setState((prev) => ({
      ...prev,
      plan: prev.plan.map((item, i) => (i === index ? { ...item, duration } : item)),
    }));
  };

  const reorderPlan = (newPlan: PlanItem[]) => {
    setState((prev) => ({
      ...prev,
      plan: newPlan,
    }));
  };

  const setPlan = (newPlan: PlanItem[]) => {
    setState((prev) => {
      const newState = {
        ...prev,
        plan: newPlan,
      };
      // Immediately persist to localStorage to avoid race conditions
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const setDrills = (drills: Drill[]) => {
    setState((prev) => {
      const newState = {
        ...prev,
        drills,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const createDrill = async (drill: Omit<Drill, 'id'>) => {
    try {
      const newDrill = await drillService.createDrill(drill);
      setState(prev => ({
        ...prev,
        drills: [...prev.drills, newDrill],
      }));
      return newDrill;
    } catch (error) {
      console.error('Failed to create drill:', error);
      throw error;
    }
  };

  const submitDrill = async (drill: Omit<Drill, 'id'>) => {
    try {
      const newDrill = await drillService.submitDrill(drill);
      setState(prev => ({
        ...prev,
        drills: [...prev.drills, newDrill],
      }));
      return newDrill;
    } catch (error) {
      console.error('Failed to submit drill:', error);
      throw error;
    }
  };
  
  const updateDrill = async (id: string, updates: Partial<Drill>) => {
    try {
      const updatedDrill = await drillService.updateDrill(id, updates);
      setState(prev => ({
        ...prev,
        drills: prev.drills.map(d => d.id === id ? updatedDrill : d),
      }));
      return updatedDrill;
    } catch (error) {
      console.error('Failed to update drill:', error);
      throw error;
    }
  };

  const deleteDrill = async (id: string) => {
    try {
      await drillService.deleteDrill(id);
      setState(prev => ({
        ...prev,
        drills: prev.drills.filter(d => d.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete drill:', error);
      throw error;
    }
  };

  const clearPlan = () => {
    setState((prev) => ({
      ...prev,
      plan: [],
    }));
  };

  const addPlayer = (player: Player) => {
    setState((prev) => ({
      ...prev,
      players: [...prev.players, player],
    }));
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deletePlayer = (id: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  };

  const addFeedback = (feedback: PracticeFeedback) => {
    setState((prev) => ({
      ...prev,
      feedback: [...prev.feedback, feedback],
    }));
  };

  const updateProfile = (updates: Partial<AppState["profile"]>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  };

  const loadModerationQueue = async () => {
    try {
      const pendingDrills = await drillService.fetchModerationQueue();
      setState(prev => ({
        ...prev,
        moderationQueue: pendingDrills,
      }));
      return pendingDrills;
    } catch (error) {
      console.error('Failed to load moderation queue:', error);
      throw error;
    }
  };

  const exportData = () => {
    return JSON.stringify(state, null, 2);
  };

  const importData = (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      setState(imported);
      return true;
    } catch {
      return false;
    }
  };

  const resetData = () => {
    setState(getDefaultState());
  };

  return {
    state,
    drillsLoading,
    drillsError,
    hasLoadedDrills,
    addToPlan,
    removeFromPlan,
    updatePlanItemDuration,
    reorderPlan,
    setPlan,
    setDrills,
    createDrill,
    submitDrill,    
    updateDrill,
    deleteDrill,
    clearPlan,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addFeedback,
    updateProfile,
    loadModerationQueue,
    exportData,
    importData,
    resetData,
    loadDrillsFromDatabase,
  };
};
