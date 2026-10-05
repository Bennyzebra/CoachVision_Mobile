import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SharedItem, Comment as CommentType } from "@/types/community";
import { Heart, Bookmark, Share2, Copy, Flag, MessageCircle, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/hooks/useAppState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export default function SharedItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { addToPlan } = useAppState();
  const [item, setItem] = useState<SharedItem | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadItem();
    incrementViews();
  }, [itemId]);

  const incrementViews = async () => {
    if (!itemId) return;
    try {
      // Increment views count directly
      const { data: currentItem } = await supabase
        .from("shared_items")
        .select("views_count")
        .eq("id", itemId)
        .single();
      
      if (currentItem) {
        await supabase
          .from("shared_items")
          .update({ views_count: (currentItem.views_count || 0) + 1 })
          .eq("id", itemId);
      }
    } catch (error) {
      console.error("Failed to increment views", error);
    }
  };

  const loadItem = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data: itemData, error: itemError } = await supabase
        .from("shared_items")
        .select("*")
        .eq("id", itemId)
        .maybeSingle();

      if (itemError) {
        console.error("Item load error:", itemError);
        toast.error(`Failed to load item: ${itemError.message}`);
        setLoading(false);
        return;
      }

      if (!itemData) {
        toast.error("Item not found");
        setLoading(false);
        return;
      }

      const { data: ownerProfile } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("id", itemData.owner_user_id)
        .maybeSingle();

      let isLiked = false;
      let isSaved = false;

      if (user) {
        const [{ data: likeData }, { data: saveData }] = await Promise.all([
          supabase.from("likes").select("id").eq("user_id", user.id).eq("item_id", itemId).maybeSingle(),
          supabase.from("saved_items").select("id").eq("user_id", user.id).eq("item_id", itemId).maybeSingle()
        ]);

        isLiked = !!likeData;
        isSaved = !!saveData;
      }

      setItem({
        ...(itemData as unknown as SharedItem),
        owner_profile: ownerProfile,
        is_liked: isLiked,
        is_saved: isSaved
      });

      const { data: commentsData } = await supabase
        .from("comments")
        .select("*")
        .eq("item_id", itemId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (commentsData && commentsData.length > 0) {
        const commentUserIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: commentProfiles } = await supabase
          .from("coach_profiles")
          .select("*")
          .in("id", commentUserIds);
        
        const profileMap = new Map(commentProfiles?.map(p => [p.id, p]) || []);
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          user_profile: profileMap.get(comment.user_id)
        }));

        setComments(commentsWithProfiles as unknown as CommentType[]);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Item load error:", error);
      toast.error(`Failed to load item: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !itemId) return;

      if (item?.is_liked) {
        await supabase.from("likes").delete().eq("user_id", user.id).eq("item_id", itemId);
      } else {
        await supabase.from("likes").insert({ user_id: user.id, item_id: itemId });
      }

      loadItem();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !itemId) return;

      if (item?.is_saved) {
        await supabase.from("saved_items").delete().eq("user_id", user.id).eq("item_id", itemId);
        toast.success("Removed from saved");
      } else {
        await supabase.from("saved_items").insert({ user_id: user.id, item_id: itemId });
        toast.success("Saved!");
      }

      loadItem();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !itemId) return;

      await supabase.from("comments").insert({
        item_id: itemId,
        user_id: user.id,
        text: newComment.trim()
      });

      setNewComment("");
      loadItem();
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    }
  };

  const handleFork = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !item) return;

      // Create a copy with attribution
      const { data: forkedItem, error } = await supabase
        .from("shared_items")
        .insert({
          owner_user_id: user.id,
          item_type: item.item_type,
          visibility: "private",
          title: `${item.title} (Copy)`,
          summary: item.summary,
          tags: item.tags,
          age_levels: item.age_levels,
          skill_focus: item.skill_focus,
          duration_mins: item.duration_mins,
          equipment: item.equipment,
          media: item.media,
          source_ref: item.source_ref,
          attribution: {
            original_item_id: item.id,
            original_author_user_id: item.owner_user_id
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Increment fork count
      await supabase
        .from("shared_items")
        .update({ forks_count: (item.forks_count || 0) + 1 })
        .eq("id", item.id);

      toast.success("Forked! You can now edit your copy.");
      navigate(`/community/item/${forkedItem.id}`);
    } catch (error) {
      toast.error("Failed to fork item");
      console.error(error);
    }
  };

  const handleUseInPlan = () => {
    if (!item?.source_ref?.id) {
      toast.error("Cannot add to plan");
      return;
    }

    addToPlan(item.source_ref.id);
    toast.success("Added to your practice plan!");
    navigate("/plan");
  };

  const handleDelete = async () => {
    if (!itemId) return;

    try {
      const { error } = await supabase
        .from("shared_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Delete error:", error);
        toast.error(`Failed to delete: ${error.message}`);
        return;
      }

      toast.success("Post deleted successfully");
      navigate("/community");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete: ${getErrorMessage(error)}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">Loading...</div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">Item not found</div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/community")} className="mb-4">
          ← Back to Community
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar
                  className="cursor-pointer"
                  onClick={() => navigate(`/community/profile/${item.owner_user_id}`)}
                >
                  <AvatarImage src={item.owner_profile?.avatar_url} />
                  <AvatarFallback>
                    {item.owner_profile?.display_name?.substring(0, 2).toUpperCase() || 'CO'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p
                    className="font-semibold cursor-pointer hover:underline"
                    onClick={() => navigate(`/community/profile/${item.owner_user_id}`)}
                  >
                    {item.owner_profile?.display_name || 'Anonymous Coach'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {item.sponsored && (
                <Badge variant="secondary">Sponsored</Badge>
              )}
            </div>

            <CardTitle className="text-3xl">{item.title}</CardTitle>
            <CardDescription className="text-base">{item.summary}</CardDescription>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="capitalize">{item.item_type}</Badge>
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {item.views_count} views
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                {item.saves_count} saves
              </div>
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {item.forks_count} forks
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button onClick={handleLike} variant={item.is_liked ? "default" : "outline"}>
                <Heart className="mr-2 h-4 w-4" />
                {item.is_liked ? "Liked" : "Like"}
              </Button>
              <Button onClick={handleSave} variant={item.is_saved ? "default" : "outline"}>
                <Bookmark className="mr-2 h-4 w-4" />
                {item.is_saved ? "Saved" : "Save"}
              </Button>
              <Button onClick={handleFork} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Fork
              </Button>
              {item.item_type === "drill" && (
                <Button onClick={handleUseInPlan}>
                  Use in Plan
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              {currentUserId === item.owner_user_id && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <Separator className="my-6" />

            {item.age_levels?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Age Levels</h3>
                <div className="flex flex-wrap gap-2">
                  {item.age_levels.map((level) => (
                    <Badge key={level} variant="secondary">{level}</Badge>
                  ))}
                </div>
              </div>
            )}

            {item.skill_focus?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Skill Focus</h3>
                <div className="flex flex-wrap gap-2">
                  {item.skill_focus.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {item.equipment?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Equipment</h3>
                <p className="text-sm text-muted-foreground">{item.equipment.join(", ")}</p>
              </div>
            )}

            {item.duration_mins && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Duration</h3>
                <p className="text-sm text-muted-foreground">{item.duration_mins} minutes</p>
              </div>
            )}

            {item.attribution && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Forked from original by{" "}
                  <span className="font-semibold cursor-pointer hover:underline">
                    another coach
                  </span>
                </p>
              </div>
            )}

            <Separator className="my-6" />

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </h3>

              <div className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {comment.user_profile?.display_name?.substring(0, 2).toUpperCase() || 'CO'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-sm">
                          {comment.user_profile?.display_name || 'Anonymous Coach'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will remove all comments and interactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
