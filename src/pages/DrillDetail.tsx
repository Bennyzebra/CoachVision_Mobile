import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Star, CheckCircle2, ExternalLink } from "lucide-react";

const DrillDetail = () => {
  const { id } = useParams();
    const location = useLocation();
  const navigate = useNavigate();
  const { state, addToPlan } = useAppState();

    const navigationState = location.state as { fromAutoPlan?: boolean } | null;
  const shouldHideAddToPlan = Boolean(navigationState?.fromAutoPlan);

  const drill = state.drills.find((d) => d.id === id);

  if (!drill) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Drill not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const focusColors: Record<string, string> = {
    offense: "bg-secondary text-secondary-foreground",
    defense: "bg-primary text-primary-foreground",
    passing: "bg-accent text-accent-foreground",
    conditioning: "bg-destructive text-destructive-foreground",
  };

  const isAdded = state.plan.some((p) => p.drillId === drill.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{drill.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={focusColors[drill.focus]}>
                  {drill.focus}
                </Badge>
                {drill.verified && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="font-medium">{drill.rating}</span>
                </div>
              </div>
            </div>

            {!shouldHideAddToPlan && (
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  addToPlan(drill.id);
                  navigate("/plan");
                }}
                disabled={isAdded}
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Default Duration</h3>
            <p className="text-lg">{drill.duration} minutes</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{drill.description}</p>
          </div>

          {drill.cues && drill.cues.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Coaching Cues</h3>
              <ul className="space-y-2">
                {drill.cues.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-muted-foreground">{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drill.tags && drill.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex gap-2 flex-wrap">
                {drill.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {drill.mediaUrl && (
            <div>
              <h3 className="font-semibold mb-3">Media</h3>
              <a
                href={drill.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                View drill video/resource
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrillDetail;
