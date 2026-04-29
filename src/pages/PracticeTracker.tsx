import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  listPractices,
  Practice,
  PracticePlan,
  updatePractice,
} from "@/services/practiceService";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Clock, Copy, Pencil } from "lucide-react";

const PAGE_SIZE = 10;
const GENERATED_PLAN_STORAGE_KEY = "coachvision-auto-plan-generated";
const GENERATED_PLAN_TITLE_STORAGE_KEY = "coachvision-auto-plan-title";
type SegmentKey = keyof Pick<PracticePlan, "warmup" | "main_segment" | "cool_down">;

const segmentLabels: Record<SegmentKey, string> = {
  warmup: "Warmup",
  main_segment: "Main",
  cool_down: "Cool Down",
};

const formatDisplayDate = (practice: Practice) => {
  const date = practice.scheduled_date ?? practice.created_at;
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getPracticeSummary = (practice: Practice) => {
  const drillsCount =
    practice.plan_details.warmup.length +
    practice.plan_details.main_segment.length +
    practice.plan_details.cool_down.length;

  return {
    drillsCount,
    totalDuration: practice.duration,
    rating: practice.feedback_rating,
  };
};

const PracticeTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, teams } = useTeam();

  const [loading, setLoading] = useState(true);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReusing, setIsReusing] = useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "planned">("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPlan, setEditPlan] = useState<PracticePlan | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const selectedTeamId = useMemo(() => {
    if (teamFilter !== "all") return teamFilter;
    return currentTeam?.id;
  }, [teamFilter, currentTeam?.id]);

  const loadPractices = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await listPractices({
      coachId: user.id,
      teamId: selectedTeamId,
      search,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      status,
      page,
      pageSize: PAGE_SIZE,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    if (error || !data) {
      toast.error("Failed to load practice history");
      setLoading(false);
      return;
    }

    setPractices(data.data);
    setTotalCount(data.total);
    setLoading(false);
  };

  useEffect(() => {
    loadPractices();
  }, [user?.id, selectedTeamId, status, page]);

  const handleApplyFilters = async () => {
    setPage(1);
    await loadPractices();
  };

  const openDetails = (practice: Practice) => {
    setSelectedPractice(practice);
    setEditTitle(practice.title || "");
    setEditDate(practice.scheduled_date ? practice.scheduled_date.slice(0, 10) : "");
    setEditNotes(practice.notes || practice.plan_details.coach_notes || "");
    setEditPlan(structuredClone(practice.plan_details));
    setSheetOpen(true);
  };

  const moveDrill = (segment: SegmentKey, index: number, direction: -1 | 1) => {
    if (!editPlan) return;
    const nextIndex = index + direction;
    const segmentItems = [...editPlan[segment]];
    if (nextIndex < 0 || nextIndex >= segmentItems.length) return;
    const [item] = segmentItems.splice(index, 1);
    segmentItems.splice(nextIndex, 0, item);
    setEditPlan({ ...editPlan, [segment]: segmentItems });
  };

  const updateDrillDuration = (segment: SegmentKey, index: number, duration: number) => {
    if (!editPlan) return;
    const next = { ...editPlan };
    next[segment] = next[segment].map((drill, idx) => (idx === index ? { ...drill, duration } : drill));
    setEditPlan(next);
  };

  const handleSave = async () => {
    if (!user || !selectedPractice || !editPlan) return;

    setIsSaving(true);
    const { data, error } = await updatePractice(
      selectedPractice.id,
      user.id,
      {
        title: editTitle.trim() || null,
        scheduled_date: editDate ? new Date(editDate).toISOString() : null,
        notes: editNotes.trim() || null,
        plan_details: { ...editPlan, coach_notes: editNotes.trim() || "" },
      },
      selectedTeamId || undefined
    );

    if (error || !data) {
      toast.error("Failed to save practice updates");
      setIsSaving(false);
      return;
    }

    toast.success("Practice updated");
    setSelectedPractice(data);
    setSheetOpen(true);
    await loadPractices();
    setIsSaving(false);
  };

  const handleUseAgain = async () => {
    if (!user || !selectedPractice) return;
    setIsReusing(true);

    try {
      const planToReview = structuredClone(editPlan ?? selectedPractice.plan_details);
      window.sessionStorage.setItem(GENERATED_PLAN_STORAGE_KEY, JSON.stringify(planToReview));
      const titleToReview = (editTitle || selectedPractice.title || "").trim();
      
      toast.success("Practice loaded into review. Confirm and save when ready.");
      window.sessionStorage.setItem(GENERATED_PLAN_TITLE_STORAGE_KEY, titleToReview);      
      setIsReusing(false);
      setSheetOpen(false);
      navigate("/auto-plan");
    } catch (error) {
      console.error("Failed to prepare practice for review:", error);
      toast.error("Failed to reuse this practice");
      setIsReusing(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Browse, edit, and reuse your historical practices.</p>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="space-y-1 lg:col-span-2">
            <Label>Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or notes" />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Team</Label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Current team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-6 flex justify-end">
            <Button onClick={handleApplyFilters}>Apply filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[240px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : practices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium">No practices found</p>
              <p className="text-sm">Try updating your filters or create a new practice first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {practices.map((practice) => {
                const summary = getPracticeSummary(practice);
                const isCompleted = Boolean(practice.completed_at);
                return (
                  <button
                    key={practice.id}
                    type="button"
                    onClick={() => openDetails(practice)}
                    className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{practice.title || "Untitled practice"}</div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDisplayDate(practice)}
                          </span>
                          <span>{summary.totalDuration} min</span>
                          <span>{summary.drillsCount} drills</span>
                          {summary.rating ? <span>Rating: {summary.rating}/5</span> : null}
                        </div>
                      </div>
                      <Badge variant="secondary" className={isCompleted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Planned</span>
                        )}
                      </Badge>
                    </div>
                  </button>
                );
              })}
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                  <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Practice Details</SheetTitle>
            <SheetDescription>Review drills, coach notes, and update this session.</SheetDescription>
          </SheetHeader>

          {selectedPractice && editPlan ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scheduled date</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Coach notes</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} />
              </div>

              {(["warmup", "main_segment", "cool_down"] as SegmentKey[]).map((segment) => (
                <Card key={segment}>
                  <CardHeader>
                    <CardTitle className="text-base">{segmentLabels[segment]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editPlan[segment].length === 0 ? (
                      <p className="text-sm text-muted-foreground">No drills logged for this segment.</p>
                    ) : (
                      editPlan[segment].map((drill, index) => (
                        <div key={`${segment}-${drill.id}-${index}`} className="border rounded-md p-2 space-y-2">
                          <div className="font-medium">{index + 1}. {drill.name}</div>
                          <div className="flex gap-2 items-center">
                            <Label className="text-xs">Duration</Label>
                            <Input
                              type="number"
                              min={1}
                              value={drill.duration}
                              onChange={(e) => updateDrillDuration(segment, index, Number(e.target.value || 1))}
                              className="w-24"
                            />
                            <Button variant="outline" size="sm" onClick={() => moveDrill(segment, index, -1)}>Up</Button>
                            <Button variant="outline" size="sm" onClick={() => moveDrill(segment, index, 1)}>Down</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="space-y-1">
                <p className="text-sm font-medium">Feedback notes</p>
                <p className="text-sm text-muted-foreground">{selectedPractice.feedback_notes || "No feedback notes yet."}</p>
              </div>
            </div>
          ) : null}

          <SheetFooter>
            <Button variant="outline" onClick={handleUseAgain} disabled={isReusing}>
              <Copy className="h-4 w-4 mr-2" />
              {isReusing ? "Reusing..." : "Use Again"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Pencil className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Edit & Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PracticeTracker;