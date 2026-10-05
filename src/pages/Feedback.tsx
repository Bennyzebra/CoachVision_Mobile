import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mood } from "@/types";
import { Frown, Meh, Smile } from "lucide-react";
import { format } from "date-fns";

type DrillFeedbackStats = {
  happy: number;
  meh: number;
  sad: number;
  lastDate?: string;
  comments: Array<{ dateISO: string; text: string }>
};

const moodConfig: Record<
  Mood,
  { label: string; icon: typeof Smile; color: string; bg: string }
> = {
  happy: { label: "Positive", icon: Smile, color: "text-green-600", bg: "bg-green-50" },
  meh: { label: "Neutral", icon: Meh, color: "text-amber-600", bg: "bg-amber-50" },
  sad: { label: "Negative", icon: Frown, color: "text-red-600", bg: "bg-red-50" },
};

const sentimentScore = (stats: DrillFeedbackStats) =>
  (stats.happy - stats.sad) / Math.max(stats.happy + stats.meh + stats.sad, 1);

const Feedback = () => {
const { state } = useAppState();
  const { drills, feedback } = state;
  const navigate = useNavigate();
    const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  const latestFeedback = useMemo(() => {
    if (feedback.length === 0) return null;
    return [...feedback].sort(
      (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    )[0];
  }, [feedback]);

  const aggregatedStats = useMemo(() => {
    return feedback.reduce<Record<string, DrillFeedbackStats>>((acc, session) => {
      session.items.forEach((item) => {
        const entry = acc[item.drillId] ?? { happy: 0, meh: 0, sad: 0, comments: [] };
        entry[item.mood] += 1;
        if (!entry.lastDate || new Date(session.dateISO) > new Date(entry.lastDate)) {
          entry.lastDate = session.dateISO;
        }
        if (session.practiceNotes) {
          entry.comments.push({ dateISO: session.dateISO, text: session.practiceNotes });
        }
        acc[item.drillId] = entry;
      });
      return acc;
    }, {});
  }, [feedback]);

  const latestDrillEntries = useMemo(() => {
    if (!latestFeedback) return [];
    return latestFeedback.items
      .map((item) => {
        const drill = drills.find((d) => d.id === item.drillId);
        if (!drill) return null;
        const stats = aggregatedStats[item.drillId] ?? { happy: 0, meh: 0, sad: 0, comments: [] };
        return {
          drill,
          latestMood: item.mood,
          stats,
          totalFeedback: stats.happy + stats.meh + stats.sad,
        };
      })
      .filter(Boolean) as Array<{
      drill: (typeof drills)[number];
      latestMood: Mood;
      stats: DrillFeedbackStats;
      totalFeedback: number;
    }>;
  }, [aggregatedStats, drills, latestFeedback]);

  const filteredEntries = useMemo(() => {
    const query = search.toLowerCase();
    const sorted = [...latestDrillEntries].filter((entry) =>
      entry.drill.name.toLowerCase().includes(query)
    );

    return sorted.sort((a, b) => {
      if (sort === "name") {
        return a.drill.name.localeCompare(b.drill.name);
      }
      if (sort === "sentiment") {
        return sentimentScore(b.stats) - sentimentScore(a.stats);
      }
      if (sort === "volume") {
        return b.totalFeedback - a.totalFeedback;
      }
      return new Date(b.stats.lastDate ?? 0).getTime() - new Date(a.stats.lastDate ?? 0).getTime();
    });
  }, [latestDrillEntries, search, sort]);

  if (!latestFeedback) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Practice Feedback</h1>
          <p className="text-muted-foreground">
            Collect player moods and comments after running a practice to see trends here.
          </p>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">No feedback logged yet.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => navigate("/run")}>Run a practice</Button>
              <Button variant="outline" onClick={() => navigate("/plan")}>
                Build a plan
              </Button>
            </div>         
          </CardContent>
        </Card>
      </div>
    );
  }

  const moodIcon = (mood: Mood) => {
    const { icon: Icon, color, bg, label } = moodConfig[mood];
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-muted-foreground">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Practice Feedback</h1>
        <p className="text-muted-foreground">
          Latest practice insights with trends across all recorded sessions.
                  </p>
        <p className="text-sm text-muted-foreground">
          Last updated {format(new Date(latestFeedback.dateISO), "PPpp")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Drills in latest practice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{latestDrillEntries.length}</div>
            <p className="text-sm text-muted-foreground">ready for deeper review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total feedback events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {Object.values(aggregatedStats).reduce(
                (total, stats) => total + stats.happy + stats.meh + stats.sad,
                0
              )}
            </div>
            <p className="text-sm text-muted-foreground">across all practices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {Math.round(
                sentimentScore(
                  Object.values(aggregatedStats).reduce(
                    (acc, stats) => ({
                      happy: acc.happy + stats.happy,
                      meh: acc.meh + stats.meh,
                      sad: acc.sad + stats.sad,
                      comments: [...acc.comments, ...stats.comments],
                    }),
                    { happy: 0, meh: 0, sad: 0, comments: [] as DrillFeedbackStats["comments"] }
                  )
                ) * 100
              )}%
            </div>
            <p className="text-sm text-muted-foreground">positive score</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Latest practice drills</CardTitle>
            <p className="text-sm text-muted-foreground">
              Filter and sort to focus on the drills that need attention.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Filter by drill name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-[240px]"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Sort drills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="sentiment">Highest sentiment</SelectItem>
                <SelectItem value="volume">Most feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredEntries.length === 0 && (
            <p className="text-sm text-muted-foreground">No drills match your filters.</p>
          )}

          {filteredEntries.map(({ drill, latestMood, stats, totalFeedback }) => {
            const score = sentimentScore(stats);
            return (
              <Card
                key={drill.id}
                className="transition hover:border-primary/40 cursor-pointer"
                onClick={() => navigate(`/feedback/drill/${drill.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{drill.name}</h3>
                        <Badge variant="secondary" className="capitalize">
                          {drill.focus}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {drill.duration} min • {drill.tags?.slice(0, 2).join(" • ")}
                      </div>
                    </div>
                    {moodIcon(latestMood)}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Positive</p>
                      <p className="text-lg font-semibold">{stats.happy}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Neutral</p>
                      <p className="text-lg font-semibold">{stats.meh}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Negative</p>
                      <p className="text-lg font-semibold">{stats.sad}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Sentiment score</p>
                      <p className="text-lg font-semibold">{Math.round(score * 100)}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {totalFeedback} total reactions • Last update {" "}
                      {stats.lastDate ? format(new Date(stats.lastDate), "PP") : "N/A"}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{stats.comments.length} comments</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/feedback/drill/${drill.id}`);
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
