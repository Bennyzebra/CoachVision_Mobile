import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrillFocus } from "@/types";
import { toast } from "sonner";
import { formatSupabaseError } from "@/lib/services/drillService";

const Submit = () => {
  const { submitDrill } = useAppState();
  const [formData, setFormData] = useState({
    name: "",
    focus: "offense" as DrillFocus,
    duration: 10,
    description: "",
    cues: "",
    tags: "",
    mediaUrl: "",
    minPlayers: "",
    maxPlayers: "",
    optimalGroupSize: "",
    intensity: "",
    positionsEmphasis: {
      G: "",
      F: "",
      C: "",
    },
    requiresFullCourt: false,    
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

    const parseOptionalInt = (value: string) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const parseOptionalFloat = (value: string) => {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const minPlayers = parseOptionalInt(formData.minPlayers);
    const maxPlayers = parseOptionalInt(formData.maxPlayers);
    const optimalGroupSize = parseOptionalInt(formData.optimalGroupSize);
    const intensity = parseOptionalInt(formData.intensity);

    if (minPlayers !== undefined && minPlayers < 1) {
      toast.error("Minimum players must be at least 1.");
      return;
    }
    if (maxPlayers !== undefined && maxPlayers < 1) {
      toast.error("Maximum players must be at least 1.");
      return;
    }
    if (minPlayers !== undefined && maxPlayers !== undefined && minPlayers > maxPlayers) {
      toast.error("Minimum players cannot exceed maximum players.");
      return;
    }
    if (optimalGroupSize !== undefined && optimalGroupSize < 1) {
      toast.error("Optimal group size must be at least 1.");
      return;
    }
    if (
      optimalGroupSize !== undefined &&
      minPlayers !== undefined &&
      optimalGroupSize < minPlayers
    ) {
      toast.error("Optimal group size cannot be less than minimum players.");
      return;
    }
    if (
      optimalGroupSize !== undefined &&
      maxPlayers !== undefined &&
      optimalGroupSize > maxPlayers
    ) {
      toast.error("Optimal group size cannot exceed maximum players.");
      return;
    }
    if (intensity !== undefined && (intensity < 1 || intensity > 5)) {
      toast.error("Intensity must be between 1 and 5.");
      return;
    }

    const positionsEmphasisEntries = Object.entries(formData.positionsEmphasis)
      .map(([key, value]) => {
        if (!value) return null;
        const parsed = parseOptionalFloat(value);
        if (parsed === undefined || parsed < 0 || parsed > 1) {
          return { key, value: null };
        }
        return { key, value: parsed };
      })
      .filter(Boolean) as Array<{ key: string; value: number | null }>;

    if (positionsEmphasisEntries.some((entry) => entry.value === null)) {
      toast.error("Position emphasis values must be between 0 and 1.");
      return;
    }

    const positionsEmphasis = positionsEmphasisEntries.reduce(
      (acc, entry) => {
        if (entry.value !== null) {
          acc[entry.key] = entry.value;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    try {
      await submitDrill({
        name: formData.name,
        focus: formData.focus,
        duration: formData.duration,
        rating: 0,
        description: formData.description,
        cues: formData.cues.split("\n").filter((c) => c.trim()),
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        mediaUrl: formData.mediaUrl || undefined,
        minPlayers,
        maxPlayers,
        optimalGroupSize,
        intensity: intensity as 1 | 2 | 3 | 4 | 5 | undefined,
        positionsEmphasis: Object.keys(positionsEmphasis).length > 0 ? positionsEmphasis : undefined,
        requiresFullCourt: formData.requiresFullCourt,
      });

      toast.success("Drill submitted for review!");

      setFormData({
        name: "",
        focus: "offense",
        duration: 10,
        description: "",
        cues: "",
        tags: "",
        mediaUrl: "",
        minPlayers: "",
        maxPlayers: "",
        optimalGroupSize: "",
        intensity: "",
        positionsEmphasis: {
          G: "",
          F: "",
          C: "",
        },
        requiresFullCourt: false,
      });
    } catch (error) {
      console.error("Failed to submit drill:", error);
      const details = formatSupabaseError(error);
      const message = import.meta.env.DEV
        ? `Unable to submit drill. ${details}`
        : "Unable to submit drill. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-muted-foreground">
          Add a drill to your library and share it to the community
        </p>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="rounded-xl">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <h2 className="text-lg font-semibold">Basics</h2>
                <div>
                  <Label htmlFor="name">Drill Name *</Label>
                  <Input
                    id="name"
                    className="h-11"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="focus">Focus *</Label>
                  <Select
                    value={formData.focus}
                    onValueChange={(value: DrillFocus) =>
                      setFormData({ ...formData, focus: value })
                    }
                  >
                    <SelectTrigger id="focus" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offense">Offense</SelectItem>
                      <SelectItem value="defense">Defense</SelectItem>
                      <SelectItem value="passing">Passing</SelectItem>
                      <SelectItem value="conditioning">Conditioning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Default Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    className="h-11"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 10 })
                    }
                    required                    
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the drill and what it teaches"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="min-h-28"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="cues">Coaching Cues (one per line)</Label>
                  <Textarea
                    id="cues"
                    placeholder="Stay low; arms out"
                    value={formData.cues}
                    onChange={(e) => setFormData({ ...formData, cues: e.target.value })}
                    rows={4}
                    className="min-h-32"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>                  
                  <Input
                    id="tags"
                    className="h-11"
                    placeholder="e.g., fundamentals, small-group, guard"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <h2 className="text-lg font-semibold">Logistics</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="minPlayers">Minimum Players</Label>
                    <Input
                      id="minPlayers"
                      className="h-11"
                      type="number"
                      min="1"
                      placeholder="2"
                      value={formData.minPlayers}
                      onChange={(e) => setFormData({ ...formData, minPlayers: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPlayers">Maximum Players</Label>
                    <Input
                      id="maxPlayers"
                      className="h-11"
                      type="number"
                      min="1"
                      placeholder="10"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="optimalGroupSize">Optimal Group Size</Label>
                    <Input
                      id="optimalGroupSize"
                      className="h-11"
                      type="number"
                      min="1"
                      placeholder="5"
                      value={formData.optimalGroupSize}
                      onChange={(e) => setFormData({ ...formData, optimalGroupSize: e.target.value })}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <h2 className="text-lg font-semibold">Optional</h2>
                <Accordion type="single" collapsible>
                  <AccordionItem value="optional-details" className="border-none">
                    <AccordionTrigger className="py-2">Optional details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div>
                          <Label htmlFor="mediaUrl">Media Link (optional)</Label>
                          <Input
                            id="mediaUrl"
                            className="h-11"
                            type="url"
                            placeholder="https://..."
                            value={formData.mediaUrl}
                            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="intensity">Intensity (1-5)</Label>
                            <Select
                              value={formData.intensity}
                              onValueChange={(value) => setFormData({ ...formData, intensity: value })}
                            >
                              <SelectTrigger id="intensity" className="h-11">
                                <SelectValue placeholder="Select intensity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Light</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3 - Moderate</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5 - Intense</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Position Emphasis (0.0 - 1.0)</Label>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <Label htmlFor="positionG" className="text-xs text-muted-foreground">Guards</Label>
                              <Input
                                id="positionG"
                                className="h-11"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                placeholder="0.7"
                                value={formData.positionsEmphasis.G}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    positionsEmphasis: {
                                      ...formData.positionsEmphasis,
                                      G: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="positionF" className="text-xs text-muted-foreground">Forwards</Label>
                              <Input
                                id="positionF"
                                className="h-11"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                placeholder="0.3"
                                value={formData.positionsEmphasis.F}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    positionsEmphasis: {
                                      ...formData.positionsEmphasis,
                                      F: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="positionC" className="text-xs text-muted-foreground">Centers</Label>
                              <Input
                                id="positionC"
                                className="h-11"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                placeholder="0.1"
                                value={formData.positionsEmphasis.C}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    positionsEmphasis: {
                                      ...formData.positionsEmphasis,
                                      C: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex min-h-11 items-center gap-2">
                          <Checkbox
                            id="requiresFullCourt"
                            checked={formData.requiresFullCourt}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, requiresFullCourt: checked === true })
                            }
                          />
                          <Label htmlFor="requiresFullCourt">Requires full court</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="h-12 w-full">
              Submit Drill for Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Submit;
