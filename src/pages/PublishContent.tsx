import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export default function PublishContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [itemType, setItemType] = useState<"drill" | "plan">("drill");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [ageLevels, setAgeLevels] = useState<string[]>([]);
  const [skillFocus, setSkillFocus] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [equipmentInput, setEquipmentInput] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddEquipment = () => {
    if (equipmentInput.trim() && !equipment.includes(equipmentInput.trim())) {
      setEquipment([...equipment, equipmentInput.trim()]);
      setEquipmentInput("");
    }
  };

  const handleRemoveEquipment = (item: string) => {
    setEquipment(equipment.filter(e => e !== item));
  };

  const toggleAgeLevel = (level: string) => {
    if (ageLevels.includes(level)) {
      setAgeLevels(ageLevels.filter(l => l !== level));
    } else {
      setAgeLevels([...ageLevels, level]);
    }
  };

  const toggleSkillFocus = (skill: string) => {
    if (skillFocus.includes(skill)) {
      setSkillFocus(skillFocus.filter(s => s !== skill));
    } else {
      setSkillFocus([...skillFocus, skill]);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to publish");
        setLoading(false);
        return;
      }

      const { data: coachProfile, error: profileError } = await supabase
        .from("coach_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile check error:", profileError);
        toast.error("Error checking profile. Please try again.");
        setLoading(false);
        return;
      }

      if (!coachProfile) {
        const { error: createError } = await supabase
          .from("coach_profiles")
          .insert({
            id: user.id,
            coach_name: user.email?.split('@')[0] || 'Coach',
            email: user.email ?? null
          });

        if (createError) {
          console.error("Profile creation error:", createError);
          toast.error("Please complete your profile in Settings before publishing");
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("shared_items")
        .insert({
          owner_user_id: user.id,
          item_type: itemType,
          visibility: visibility,
          title: title.trim(),
          summary: summary.trim() || undefined,
          tags: tags,
          age_levels: ageLevels,
          skill_focus: skillFocus,
          duration_mins: duration ? parseInt(duration) : undefined,
          equipment: equipment,
          media: [],
          sponsored: false,
          views_count: 0,
          saves_count: 0,
          forks_count: 0,
          used_in_plans_count: 0,
          status: "active"
        })
        .select()
        .single();

      if (error) {
        console.error("Publish error:", error);
        toast.error(`Failed to publish: ${error.message}`);
        setLoading(false);
        return;
      }

      toast.success("Content published successfully!");
      setTimeout(() => {
        navigate(`/community/item/${data.id}`);
      }, 500);
    } catch (error) {
      console.error("Error publishing content:", error);
      toast.error(`Failed to publish content: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/community")}>
        ← Back to Community
      </Button>

      <Card>
        <CardHeader className="space-y-4 border-b bg-muted/40">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-3xl font-bold">New Drill Post</CardTitle>
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
              Community
            </span>
          </div>
          <CardDescription className="text-base">
            Share polished drills and practice plans with the community in a clean, professional format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={itemType} onValueChange={(value) => setItemType(value as "drill" | "plan")}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Choose what you're sharing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drill">Drill</SelectItem>
                  <SelectItem value="plan">Practice Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value) => setVisibility(value as "public" | "followers" | "private")}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Who can see this post?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can see</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base"
              placeholder="Enter a clear, descriptive title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-base"
              placeholder="Describe what makes this drill or plan effective"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                className="h-11"
                placeholder="Add tags (press Enter)"
              />
              <Button type="button" onClick={handleAddTag} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Age Levels</Label>
            <div className="flex flex-wrap gap-2">
              {["Youth", "Middle School", "High School", "College", "Adult"].map((level) => (   
                <Badge
                  key={level}
                  variant={ageLevels.includes(level) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAgeLevel(level)}
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skill Focus</Label>
            <div className="flex flex-wrap gap-2">
              {["offense", "defense", "passing", "shooting", "conditioning", "rebounding"].map((skill) => (
                <Badge
                  key={skill}
                  variant={skillFocus.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleSkillFocus(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-11"
              placeholder="e.g., 15"
            />
          </div>

          <div className="space-y-2">
            <Label>Equipment</Label>
            <div className="flex gap-2">
              <Input
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEquipment())}
                className="h-11"
                placeholder="Add equipment (press Enter)"
              />
              <Button type="button" onClick={handleAddEquipment} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {equipment.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                  <button
                    onClick={() => handleRemoveEquipment(item)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePublish}
              disabled={loading || !title.trim()}
              className="flex-1 h-12 text-base shadow-sm"
            >
              {loading ? "Publishing..." : "Publish Content"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/community")}
              disabled={loading}
              className="h-12 text-base"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
