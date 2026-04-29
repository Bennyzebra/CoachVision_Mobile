import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { DrillCard } from "@/components/DrillCard";
import { Drill } from "@/types";

const Suggestions = () => {
  const { state, addToPlan } = useAppState();
  const navigate = useNavigate();

  const getSuggestions = (): Array<{ drill: Drill; reasons: string[] }> => {
    const rosterSize = state.players.length;
    const guards = state.players.filter((p) => p.position === "G").length;
    const centers = state.players.filter((p) => p.position === "C").length;
    
    const heights = state.players
      .map((p) => {
        const match = p.height.match(/(\d+)/);
        return match ? parseInt(match[0]) * 12 : 0;
      })
      .filter((h) => h > 0);
    const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : 0;

    const feedbackMap = new Map<string, number>();
    state.feedback.forEach((fb) => {
      fb.items.forEach((item) => {
        const current = feedbackMap.get(item.drillId) || 0;
        feedbackMap.set(
          item.drillId,
          current + (item.mood === "happy" ? 1 : item.mood === "sad" ? -1 : 0)
        );
      });
    });

    const suggestions = state.drills.map((drill) => {
      const reasons: string[] = [];
      let score = drill.rating;

      // Small group boost
      if (rosterSize <= 6 && drill.tags?.includes("small-group")) {
        reasons.push("Small group friendly");
        score += 0.5;
      }

      // Large group boost
      if (rosterSize >= 9 && drill.tags?.includes("full-squad")) {
        reasons.push("Great for full squad");
        score += 0.5;
      }

      // Height-based
      if (avgHeight >= 77 && drill.tags?.includes("post")) {
        reasons.push("Leverages size inside");
        score += 0.7;
      } else if (avgHeight < 72 && drill.tags?.includes("ball-handler")) {
        reasons.push("Emphasizes ball handling");
        score += 0.7;
      }

      // Position mix
      if (guards / rosterSize > 0.5 && drill.tags?.includes("ball-handler")) {
        reasons.push("Guard-heavy roster");
        score += 0.6;
      }
      if (centers / rosterSize >= 0.3 && drill.tags?.includes("post")) {
        reasons.push("Strong post presence");
        score += 0.6;
      }

      // Experience level
      if (state.profile.experience === "beginner" && drill.tags?.includes("fundamentals")) {
        reasons.push("Builds fundamentals");
        score += 0.5;
      }
      if (state.profile.experience === "advanced" && drill.tags?.includes("advanced")) {
        reasons.push("Advanced concepts");
        score += 0.5;
      }

      // Feedback
      const feedbackScore = feedbackMap.get(drill.id) || 0;
      if (feedbackScore > 0) {
        reasons.push("Players liked this");
        score += feedbackScore * 0.3;
      } else if (feedbackScore < 0) {
        score += feedbackScore * 0.3;
      }

      return { drill, reasons, score };
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  };

  const suggestions = getSuggestions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Suggested Drills</h1>
        <p className="text-muted-foreground">
          Personalized recommendations based on your roster and feedback
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map(({ drill, reasons }) => (
          <div key={drill.id} className="space-y-2">
            <DrillCard
              drill={drill}
              onAdd={addToPlan}
              onView={(id) => navigate(`/drill/${id}`)}
            />
            {reasons.length > 0 && (
              <div className="text-xs text-muted-foreground px-2">
                {reasons.slice(0, 3).join(" • ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
