import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { SharedItem } from "@/types/community";
import { Search, TrendingUp, Clock, Users, Plus, Heart, Bookmark, Share2, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"following" | "trending" | "latest">("trending");
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  useEffect(() => {
    loadFeed();
  }, [activeTab]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      let query = supabase
        .from("shared_items")
        .select("*")
        .eq("status", "active")
        .eq("visibility", "public");

      if (activeTab === "trending") {
        query = query.order("views_count", { ascending: false });
      } else if (activeTab === "latest") {
        query = query.order("created_at", { ascending: false });
      } else if (activeTab === "following") {
        if (!user) {
          setItems([]);
          setLoading(false);
          return;
        }

        const { data: follows } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", user.id);

        if (follows && follows.length > 0) {
          const followedIds = follows.map(f => f.followed_id);
          query = query.in("owner_user_id", followedIds).order("created_at", { ascending: false });
        } else {
          setItems([]);
          setLoading(false);
          return;
        }
      }

      const { data: itemsData, error } = await query.limit(20);

      if (error) {
        console.error("Feed load error:", error);
        toast.error(`Failed to load feed: ${error.message}`);
        return;
      }

      if (!itemsData || itemsData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const ownerIds = [...new Set(itemsData.map(item => item.owner_user_id))];

      const { data: profiles } = await supabase
        .from("coach_profiles")
        .select("*")
        .in("id", ownerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const itemsWithProfiles = itemsData.map(item => ({
        ...item,
        owner_profile: profileMap.get(item.owner_user_id)
      }));

      setItems(itemsWithProfiles as unknown as SharedItem[]);
    } catch (error) {
      console.error("Feed load error:", error);
      toast.error(`Failed to load feed: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Check if already liked
      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (existing) {
        // Unlike
        await supabase.from("likes").delete().eq("id", existing.id);
      } else {
        // Like
        await supabase.from("likes").insert({ user_id: user.id, item_id: itemId });
      }
      
      loadFeed();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (itemId: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: existing } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (existing) {
        await supabase.from("saved_items").delete().eq("id", existing.id);
        toast.success("Removed from saved");
      } else {
        await supabase.from("saved_items").insert({ user_id: user.id, item_id: itemId });
        toast.success("Saved!");
      }

      loadFeed();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      const { error } = await supabase
        .from("shared_items")
        .delete()
        .eq("id", deleteItemId);

      if (error) {
        console.error("Delete error:", error);
        toast.error(`Failed to delete: ${error.message}`);
        return;
      }

      toast.success("Post deleted successfully");
      setDeleteItemId(null);
      loadFeed();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete: ${getErrorMessage(error)}`);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community</h1>
            <p className="text-muted-foreground">Discover and share drills with coaches worldwide</p>
          </div>
          <Button onClick={() => navigate("/community/publish")} className="w-fit">
            <Plus className="mr-2 h-4 w-4" />
            Share Content
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drills, plans, coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "following" | "trending" | "latest")}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </div>
              </SelectItem>
              <SelectItem value="latest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Latest
                </div>
              </SelectItem>
              <SelectItem value="following">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {activeTab === "following"
                  ? "Follow coaches to see their content here"
                  : "No content available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/community/item/${item.id}`)}
                    >
                      <Avatar>
                        <AvatarImage src={item.owner_profile?.avatar_url} />
                        <AvatarFallback>
                          {item.owner_profile?.display_name?.substring(0, 2).toUpperCase() || 'CO'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{item.owner_profile?.display_name || 'Anonymous Coach'}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.owner_profile?.organization || item.owner_profile?.org || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.sponsored && (
                        <Badge variant="secondary">Sponsored</Badge>
                      )}
                      {currentUserId === item.owner_user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteItemId(item.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <div onClick={() => navigate(`/community/item/${item.id}`)} className="cursor-pointer">
                  <CardTitle className="mt-4">{item.title}</CardTitle>
                  <CardDescription>{item.summary}</CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex gap-4">
                      <span>{item.views_count} views</span>
                      <span>{item.saves_count} saves</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item.id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(item.id);
                        }}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(
                            `${window.location.origin}/community/item/${item.id}`
                          );
                          toast.success("Link copied!");
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
