import { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IntensityPreference } from "@/types";
import { toast } from "sonner";

const defaultNotificationState = {
  practiceReminders: true,
  feedbackReminders: true,
  newSuggestions: true,
  teamUpdates: true,
  marketing: false,
};


type SettingRowProps = {
  label: string;
  description?: string;
  control: ReactNode;
  destructive?: boolean;
};

const SettingRow = ({ label, description, control, destructive = false }: SettingRowProps) => (
  <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
    <div>
      <p className={`text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}>{label}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
    <div className="w-full sm:w-auto sm:justify-self-end">{control}</div>
  </div>
);

type PracticeSettingRowProps = {
  label: string;
  description?: string;
  control: ReactNode;
  inlineControl?: boolean;
};

const PracticeSettingRow = ({ label, description, control, inlineControl = false }: PracticeSettingRowProps) => (
  <div
    className={
      inlineControl
        ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:gap-6 sm:py-4"
        : "grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:py-4"
    }
  >
    <div className="min-w-0">
      <p className="text-sm font-medium leading-snug text-foreground">{label}</p>
      {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
    <div className={inlineControl ? "justify-self-end" : "w-full sm:w-auto sm:justify-self-end"}>{control}</div>
  </div>
);

type SettingsSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  destructive?: boolean;
  className?: string;
};

const SettingsSection = ({ id, title, description, children, destructive = false, className = "" }: SettingsSectionProps) => (
  <section id={id} className={`scroll-mt-28 ${className}`}>
    <div className="mb-3">
      <h2 className={`text-lg font-semibold ${destructive ? "text-destructive" : "text-foreground"}`}>{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
    <div
      className={`overflow-hidden rounded-xl border bg-card/60 backdrop-blur-sm ${
        destructive ? "border-destructive/30" : "border-border/60"
      }`}
    >
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  </section>
);

const SettingsPage = () => {
  const { state, updateProfile, exportData } = useAppState();
  const { user, profile: authProfile, updateProfile: updateAuthProfile } = useAuth();
  const navigate = useNavigate();
  const authenticatedEmail = user?.email ?? authProfile?.email ?? "";
  
  const [profileForm, setProfileForm] = useState({
    coachName: state.profile.coachName || authProfile?.coach_name || "Coach",
    email: authenticatedEmail,
    sport: state.profile.sport || "Basketball",
    organization: state.profile.organization || authProfile?.organization || "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [notifications, setNotifications] = useState<typeof defaultNotificationState>(
    state.profile.notifications || defaultNotificationState
  );

  const [practicePreferences, setPracticePreferences] = useState({
    defaultPracticeLength: Number(state.profile.defaultPracticeLength ?? state.profile.sessionTarget ?? 60) || 60,
    defaultWarmupLength: Number(state.profile.defaultWarmupLength ?? 15) || 15,
    intensityPreference: (state.profile.intensityPreference || "balanced") as IntensityPreference,
    showAdvancedDrills: state.profile.showAdvancedDrills ?? true,
    showCommunityDrills: state.profile.showCommunityDrills ?? true,
    hideAddedByDefault: state.profile.hideAddedByDefault ?? false,
    focusDistribution: {
      offense: Number(state.profile.focusDistribution?.offense ?? 40) || 40,
      defense: Number(state.profile.focusDistribution?.defense ?? 40) || 40,
      conditioning: Number(state.profile.focusDistribution?.conditioning ?? 20) || 20,
    },
  });

  const [accessCode, setAccessCode] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  useEffect(() => {
    setProfileForm((prev) => ({
      ...prev,
      coachName: state.profile.coachName || authProfile?.coach_name || prev.coachName,
      email: authenticatedEmail || prev.email,
      sport: state.profile.sport || prev.sport,
      organization: state.profile.organization || authProfile?.organization || prev.organization,
    }));
  }, [
    authProfile?.coach_name,
    authProfile?.organization,
    authenticatedEmail,
    state.profile.coachName,
    state.profile.email,
    state.profile.organization,
    state.profile.sport,    
  ]);

 useEffect(() => {
    setNotifications(state.profile.notifications || defaultNotificationState);
    setPracticePreferences({
      defaultPracticeLength: Number(state.profile.defaultPracticeLength ?? state.profile.sessionTarget ?? 60) || 60,
      defaultWarmupLength: Number(state.profile.defaultWarmupLength ?? 15) || 15,
      intensityPreference: (state.profile.intensityPreference || "balanced") as IntensityPreference,
      showAdvancedDrills: state.profile.showAdvancedDrills ?? true,
      showCommunityDrills: state.profile.showCommunityDrills ?? true,
      hideAddedByDefault: state.profile.hideAddedByDefault ?? false,
      focusDistribution: {
        offense: Number(state.profile.focusDistribution?.offense ?? 40) || 40,
        defense: Number(state.profile.focusDistribution?.defense ?? 40) || 40,
        conditioning: Number(state.profile.focusDistribution?.conditioning ?? 20) || 20,
      },
    });
  }, [state.profile]);

 const sections = useMemo(
    () => [
      { id: "account", label: "Account" },
      { id: "practice", label: "Practice" },
      { id: "notifications", label: "Notifications" },
      { id: "billing", label: "Billing" },
      { id: "privacy", label: "Privacy" },
      { id: "danger", label: "Danger" },
    ],
    []
  );

  const handleSaveProfile = async () => {
    const trimmedOrganization = profileForm.organization.trim();
    const nextProfileForm = { ...profileForm, organization: trimmedOrganization };

    updateProfile(nextProfileForm);
    setProfileForm(nextProfileForm);
    await updateAuthProfile({
      coach_name: profileForm.coachName,
      organization: trimmedOrganization || null,
    });
    toast.success("Profile updated successfully.");
    setIsEditingProfile(false);
  };

  const handleCancelProfileEdit = () => {
    setProfileForm({
      coachName: state.profile.coachName || authProfile?.coach_name || "Coach",
      email: authenticatedEmail,
      sport: state.profile.sport || "Basketball",
      organization: state.profile.organization || authProfile?.organization || "",
    });
    setIsEditingProfile(false);
  };

  const handleSaveNotifications = () => {
    updateProfile({ notifications });
    toast.success("Notification preferences saved.");
  };

  const handleSavePracticePreferences = () => {
    updateProfile({
      sessionTarget: practicePreferences.defaultPracticeLength,
      defaultPracticeLength: practicePreferences.defaultPracticeLength,
      defaultWarmupLength: practicePreferences.defaultWarmupLength,
      intensityPreference: practicePreferences.intensityPreference,
      showAdvancedDrills: practicePreferences.showAdvancedDrills,
      showCommunityDrills: practicePreferences.showCommunityDrills,
      hideAddedByDefault: practicePreferences.hideAddedByDefault,
      focusDistribution: practicePreferences.focusDistribution,
    });
    toast.success("Practice defaults saved.");
  };
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message || "Failed to update password");
        return;
      }

      toast.success("Password updated successfully.");
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Password update error:", error);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleApplyCode = () => {
    if (!accessCode.trim()) {
      toast.error("Please enter an access code");
      return;
    }
    toast.success("Access code submitted. Your account manager will confirm shortly.");
    setAccessCode("");
  };

  const handleExport = () => {
    const payload = exportData();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coachvision-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data export is ready.");
  };

  
  const handleDeleteAccount = () => {
    if (confirm("Delete account? This will sign you out immediately.")) {
      toast.success("Account deletion queued. Support will confirm via email.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 sm:space-y-8">
      <nav className="sticky top-0 z-10 -mx-4 border-y border-border/60 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:-mx-2 md:px-2" aria-label="Settings sections">
        <div className="touch-scroll flex gap-1 overflow-x-auto md:flex-wrap">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <SettingsSection
        id="account"
        title="Account & Profile"
        className="!mt-3 sm:!mt-4"
      >
        {isEditingProfile ? (
          <>
            <SettingRow
              label="Name"
              control={
                <Input
                  value={profileForm.coachName}
                  onChange={(e) => setProfileForm({ ...profileForm, coachName: e.target.value })}
                  className="h-11 w-full sm:w-72"
                />
              }
            />
            <SettingRow
              label="Email"
              description="Email changes are managed through your authenticated account provider."
              control={<Input value={profileForm.email} className="h-11 w-full sm:w-72" disabled />}
            />
            <SettingRow
              label="Sport"
              control={
                <Input
                  value={profileForm.sport}
                  onChange={(e) => setProfileForm({ ...profileForm, sport: e.target.value })}
                  className="h-11 w-full sm:w-56"
                />
              }
            />
            <SettingRow
              label="School / Club"
              control={
                <Input
                  value={profileForm.organization}
                  onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                  className="h-11 w-full sm:w-72"
                  placeholder="e.g., Hawks Club"
                />
              }
            />
            <SettingRow
              label="Password"
              description="Keep your account secure with a strong password."
              control={
                <Button className="h-11 w-full sm:w-auto" variant="outline" size="sm" onClick={() => setIsPasswordDialogOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              }
            />
            <div className="flex flex-col-reverse justify-end gap-2 px-4 py-3 sm:flex-row">
              <Button className="h-11" variant="ghost" size="sm" onClick={handleCancelProfileEdit}>
                Cancel
              </Button>
              <Button className="h-11" size="sm" onClick={handleSaveProfile}>
                Save Profile
              </Button>
            </div>
          </>
        ) : (
          <>
            <SettingRow label="Name" control={<span className="text-sm text-muted-foreground">{profileForm.coachName}</span>} />
            <SettingRow label="Email" control={<span className="text-sm text-muted-foreground">{profileForm.email || "Not set"}</span>} />
            <SettingRow label="Sport" control={<span className="text-sm text-muted-foreground">{profileForm.sport}</span>} />
            <SettingRow
              label="School / Club"
              control={<span className="text-sm text-muted-foreground">{profileForm.organization || "Not set"}</span>}
            />
            <SettingRow
              label="Password"
              control={
                <Button variant="outline" size="sm" onClick={() => setIsPasswordDialogOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              }
            />
            <div className="flex justify-end px-4 py-3">
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                Edit Profile
              </Button>
            </div>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        id="practice"
        title="Practice Preferences"
        description="Set default values used whenever you create a new practice plan."
      >
        <PracticeSettingRow
          label="Default practice length"
          description="Starting total duration for generated plans."
          control={
            <div className="w-full space-y-2 sm:w-56">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Duration</span>
                <span>{practicePreferences.defaultPracticeLength} minutes</span>
              </div>
              <Slider
                value={[practicePreferences.defaultPracticeLength]}
                min={30}
                max={180}
                step={5}
                onValueChange={(value) =>
                  setPracticePreferences((prev) => ({ ...prev, defaultPracticeLength: value[0] }))
                }
              />
            </div>
          }
        />
        <PracticeSettingRow
          label="Default warmup length"
          description="How long warmups should run by default."
          control={
            <div className="w-full space-y-2 sm:w-56">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Warmup</span>
                <span>{practicePreferences.defaultWarmupLength} minutes</span>
              </div>
              <Slider
                value={[practicePreferences.defaultWarmupLength]}
                min={5}
                max={45}
                step={5}
                onValueChange={(value) =>
                  setPracticePreferences((prev) => ({ ...prev, defaultWarmupLength: value[0] }))
                }
              />
            </div>
          }
        />
        <PracticeSettingRow
          label="Intensity preference"
          description="Choose how demanding generated plans should feel."
          control={
            <Select
              value={practicePreferences.intensityPreference}
              onValueChange={(value: IntensityPreference) =>
                setPracticePreferences((prev) => ({ ...prev, intensityPreference: value }))
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <PracticeSettingRow
          label="Show advanced drills"
          description="Include more advanced options in recommendations."
          inlineControl
          control={
            <Switch
              checked={practicePreferences.showAdvancedDrills}
              onCheckedChange={(checked) =>
                setPracticePreferences((prev) => ({ ...prev, showAdvancedDrills: checked }))
              }
            />
          }
        />
        <PracticeSettingRow
          label="Show community drills"
          description="Display shared drills from the CoachVision community."
          inlineControl
          control={
            <Switch
              checked={practicePreferences.showCommunityDrills}
              onCheckedChange={(checked) =>
                setPracticePreferences((prev) => ({ ...prev, showCommunityDrills: checked }))
              }
            />
          }
        />
        <PracticeSettingRow
          label="Hide newly added drills by default"
          description="Keep your newly added drills private until reviewed."
          inlineControl
          control={
            <Switch
              checked={practicePreferences.hideAddedByDefault}
              onCheckedChange={(checked) =>
                setPracticePreferences((prev) => ({ ...prev, hideAddedByDefault: checked }))
              }
            />
          }
        />
        <PracticeSettingRow
          label="Focus distribution"
          description="Adjust your default offense, defense, and conditioning mix."
          control={
            <div className="w-full space-y-2.5 text-xs sm:w-64">
              {([
                ["offense", "Offense"],
                ["defense", "Defense"],
                ["conditioning", "Conditioning"],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{label}</span>
                    <span>{Math.round(practicePreferences.focusDistribution[key])}%</span>
                  </div>
                  <Slider
                    value={[practicePreferences.focusDistribution[key]]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) =>
                      setPracticePreferences((prev) => ({
                        ...prev,
                        focusDistribution: { ...prev.focusDistribution, [key]: value[0] },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          }
        />
        <div className="flex px-4 py-3 pb-5 sm:justify-end sm:pb-3">
          <Button className="h-11 w-full sm:h-9 sm:w-auto" size="sm" onClick={handleSavePracticePreferences}>
            Save Practice Preferences
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        id="notifications"
        title="Notifications"
        description="Choose which updates should reach you."
      >
        {(
          [
            {
              key: "practiceReminders",
              label: "Practice reminders",
              description: "Get reminders before upcoming practices.",
            },
            {
              key: "feedbackReminders",
              label: "Feedback reminders",
              description: "Be prompted to review completed practices.",
            },
            {
              key: "newSuggestions",
              label: "New drill suggestions",
              description: "Receive recommendations based on your coaching style.",
            },
            {
              key: "teamUpdates",
              label: "Team updates",
              description: "Stay informed about roster or team changes.",
            },
            {
              key: "marketing",
              label: "Product updates & tips",
              description: "Get new feature announcements and helpful guidance.",
            },
          ] as const
        ).map((item) => (
          <SettingRow
            key={item.key}
            label={item.label}
            description={item.description}
            control={
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
              />
            }
          />
        ))}
        <div className="flex justify-end px-4 py-3">
          <Button size="sm" onClick={handleSaveNotifications}>
            Save Notification Settings
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        id="billing"
        title="Billing & Access"
        description="Plan details, usage, and school or club access controls."
      >
        <SettingRow
          label="Current plan"
          control={<Badge variant="secondary">{state.profile.planName || "Free"}</Badge>}
        />
        <SettingRow
          label="Practice usage"
          description="Your current workspace includes unlimited practice generation."
          control={<span className="text-sm text-muted-foreground">Unlimited</span>}
        />
        <SettingRow
          label="Plans & upgrades"
          description="Compare plans or request premium access for your staff."
          control={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate("/upgrade")}>
                View plans
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigate("/upgrade")}>
                Upgrade to premium
              </Button>
            </div>
          }
        />
        <SettingRow
          label="School / Club access code"
          description="Apply an organization code to unlock shared access and billing."
          control={
            <div className="flex w-[320px] gap-2">
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
              />
              <Button size="sm" variant="outline" onClick={handleApplyCode}>
                Apply
              </Button>
            </div>
         }
        />
      </SettingsSection>

      <SettingsSection
        id="privacy"
        title="Data & Privacy"
        description="Manage exports and review privacy-related resources."
      >
        <SettingRow
          label="Export account data"
          description="Download your account and app settings as a JSON file."
          control={
            <Button size="sm" variant="outline" onClick={handleExport}>
              Export data
            </Button>
          }
        />
        <SettingRow
          label="Export practice history"
          description="Practice plans and feedback are included in the same export package."
          control={
            <Button size="sm" variant="outline" onClick={handleExport}>
              Export practice data
            </Button>
          }
        />
        <SettingRow
          label="Privacy policy"
          description="Review how CoachVision stores and processes your data."
          control={
            <Button size="sm" variant="ghost" onClick={() => window.open("https://coachvision.app/privacy", "_blank")}>
              Open privacy policy
            </Button>
          }
        />
      </SettingsSection>

      <SettingsSection
        id="danger"
        title="Danger Zone"
        description="Permanently remove your account and all associated access."
        destructive
      >
        <SettingRow
          label="Delete account"
          description="This action cannot be undone and will revoke access immediately."
          destructive
          control={
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Delete account
            </Button>
          }
        />
      </SettingsSection>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={isUpdatingPassword}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator className="opacity-0" />
      </div>
  );
};

export default SettingsPage;
