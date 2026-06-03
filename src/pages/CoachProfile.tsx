import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CoachProfile as CoachProfileType, SharedItem } from "@/types/community";
import { MapPin, Award, Calendar, Users, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unknown error");

export default function CoachProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CoachProfileType | null>(null);
  const [items, setItems] = useState<SharedItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data: profileData, error: profileError } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile load error:", profileError);
        toast.error(`Failed to load profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profileData) {
        toast.error("Profile not found");
        setLoading(false);
        return;
      }

      setProfile({
        ...profileData,
        display_name: profileData.coach_name ?? "Coach",
        org: profileData.organization ?? ((profileData as Record<string, unknown>).org as string | undefined),
        followers_count: profileData.followers_count ?? 0,
        following_count: profileData.following_count ?? 0,
        badges: profileData.badges ?? [],
        sports: profileData.sports ?? [],
        years_experience: profileData.years_experience ?? 0,
      } as CoachProfileType);

      if (user?.id && userId !== user.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("followed_id", userId)
          .maybeSingle();

        setIsFollowing(!!followData);
      }

      // Load user's shared items
      const { data: itemsData } = await supabase
        .from("shared_items")
        .select("*")
        .eq("owner_user_id", userId)
        .eq("status", "active")
        .in("visibility", user?.id === userId ? ["public", "followers", "private"] : ["public"])
        .order("created_at", { ascending: false });

      setItems((itemsData as SharedItem[] | null) || []);
    } catch (error: unknown) {
      toast.error("Failed to load profile");
      console.error(getErrorMessage(error), error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !userId) return;

      if (isFollowing) {
        // Unfollow
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("followed_id", userId);
        
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        // Follow
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, followed_id: userId });
        
        setIsFollowing(true);
        toast.success("Following!");
      }

      loadProfile();
    } catch (error) {
      toast.error("Failed to update follow status");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">Loading...</div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p>Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;
  const displayName = profile.display_name || profile.coach_name || "Coach";
  const organization = profile.org || profile.organization || undefined;
  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    {organization && (
                      <p className="text-lg text-muted-foreground">{organization}</p>
                    )}
                  </div>
                  {!isOwnProfile && (
                    <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                      {isFollowing ? (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button onClick={() => navigate("/settings")} variant="outline">
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="flex gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{profile.followers_count ?? 0}</strong> followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{profile.following_count ?? 0}</strong> following</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  {(profile.years_experience ?? 0) > 0 && (
                  <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {profile.years_experience} years experience
                    </div>
                  )}
                </div>

                 {profile.badges && profile.badges.length > 0 && (               
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.badges.map((badge) => (
                      <Badge key={badge} variant="secondary">
                        <Award className="mr-1 h-3 w-3" />
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}

                {profile.bio && (
                  <p className="mt-4 text-sm">{profile.bio}</p>
                )}

                {profile.sports && profile.sports.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.sports.map((sport) => (
                      <Badge key={sport} variant="outline">{sport}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="drills" className="w-full">
          <TabsList>
            <TabsTrigger value="drills">Drills</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drills" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {items.filter(i => i.item_type === "drill").map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/community/item/${item.id}`)}
                >
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                      <span>{item.views_count} views</span>
                      <span>{item.saves_count} saves</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {items.filter(i => i.item_type === "drill").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No drills shared yet
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {items.filter(i => i.item_type === "plan").map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/community/item/${item.id}`)}
                >
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                      <span>{item.views_count} views</span>
                      <span>{item.saves_count} saves</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {items.filter(i => i.item_type === "plan").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No plans shared yet
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
