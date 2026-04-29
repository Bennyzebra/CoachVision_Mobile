import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown,
  Settings,
  Send,
  LogOut,
  HelpCircle,
  Users,
  ClipboardList,  
} from "lucide-react";
import logo from "@/assets/CoachVision_Final.png";
import { SearchBar } from "@/components/SearchBar";
import { useTeam } from "@/contexts/TeamContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { profile, session, signOut } = useAuth();
  const { theme = "system", setTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isThemeSelectOpen, setIsThemeSelectOpen] = useState(false);  
  const [isProfileDropdownHovered, setIsProfileDropdownHovered] = useState(false);  
  const userEmail = profile?.email ?? session?.user?.email ?? "Email not available";
  const coachFullName = (profile?.coach_name || "Coach").trim();
  const [firstName = "Coach", ...lastNameParts] = coachFullName.split(/\s+/).filter(Boolean);
  const lastName = lastNameParts.join(" ");
  const coachDisplayName = lastName ? `${firstName} ${lastName}` : firstName;  
  const themeTriggerRef = useRef<HTMLButtonElement | null>(null);  
  const keepThemeSelectOpenRef = useRef(false);
  
  const handleThemeSelectOpenChange = (open: boolean) => {
    if (!open && keepThemeSelectOpenRef.current) {
      keepThemeSelectOpenRef.current = false;
      setIsThemeSelectOpen(true);
      return;
    }

    setIsThemeSelectOpen(open);

    if (!open && !isProfileDropdownHovered) {
      setIsProfileMenuOpen(false);
    }    
  };

  const handleThemeValueChange = (value: string) => {
    keepThemeSelectOpenRef.current = true;
    setTheme(value);
  };

  const handleThemeSectionClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-theme-trigger]")) {
      return;
    }

    themeTriggerRef.current?.click();
  };

  const handleProfileDropdownMouseEnter = () => {
    setIsProfileDropdownHovered(true);
    setIsProfileMenuOpen(true);
  };

  const handleProfileDropdownMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    const nextElement = event.relatedTarget as HTMLElement | null;

    if (
      nextElement?.closest("[data-profile-dropdown-region='true']") ||
      nextElement?.closest("[data-profile-theme-select-content]")
    ) {
      return;
    }

    setIsProfileDropdownHovered(false);

    if (!isThemeSelectOpen) {
      setIsProfileMenuOpen(false);
    }
  };  
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div   className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Team name & logo */}
           <div className="flex items-center gap-3 z-10">
              {currentTeam?.logo_url ? (
                <img src={currentTeam.logo_url} alt={currentTeam.team_name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <img src={logo} alt="CoachVision" className="h-[7rem]" />
              )}
              <span className="hidden sm:block h-6 w-px rounded-full bg-foreground/40" aria-hidden="true" />
              <span className="font-semibold text-lg hidden sm:block">
                {currentTeam?.team_name || "CoachVision"}
              </span>
            </div>

           {/* Center: Search Bar - absolutely positioned to always be centered on screen */}
            <div className="hidden md:flex md:items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <SearchBar />
            </div>

            {/* Right: Coach dropdown */}
            <div className="flex items-center gap-2 z-10">
              <Popover open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
              <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group relative p-1 pr-7"
                    data-profile-dropdown-region="true"
                    onMouseEnter={handleProfileDropdownMouseEnter}
                    onMouseLeave={handleProfileDropdownMouseLeave}                    
                  >
                <div 
                      className={`
                  relative z-10 h-9 w-9 rounded-full bg-secondary
                        transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                        group-hover:w-[3.25rem] group-hover:rounded-[1.125rem]
                        will-change-[width,border-radius]
                        ${isProfileMenuOpen ? "w-[3.25rem] rounded-[1.125rem]" : ""}
                      `}
                    >
                      <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center text-lg font-semibold text-black">
                        {(profile?.coach_name || "Coach").charAt(0).toUpperCase()}
                      </span>
                    </div>
                                       <ChevronDown
                      className={`absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 z-0 transition-all duration-300 group-hover:opacity-0 ${
                        isProfileMenuOpen ? "opacity-0" : ""
                      }`}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-60"
                  data-profile-dropdown-region="true"                  
                  align="end"
                  sideOffset={0}
                  onMouseEnter={handleProfileDropdownMouseEnter}
                  onMouseLeave={handleProfileDropdownMouseLeave}
                  onInteractOutside={(event) => {
                  const interactionTarget = event.target as HTMLElement;
                    if (interactionTarget.closest("[data-profile-theme-select-content]")) {
                      event.preventDefault();
                    }
                  }}
                >
                <div className="space-y-1">
                    <div className="px-3 py-2 text-left">
                      <p className="text-sm font-semibold text-foreground break-words">
                        {coachDisplayName}
                      </p>
                      <p className="text-sm text-muted-foreground break-words">{userEmail}</p>
                    </div>
                    <Separator />
                    <div className="px-3 py-1.5" onClick={handleThemeSectionClick}>
                  <p className="mb-2 text-sm font-medium">Theme</p>
                      <Select
                        open={isThemeSelectOpen}
                        value={theme}
                        onValueChange={handleThemeValueChange}
                        onOpenChange={handleThemeSelectOpenChange}
                      >
                      <SelectTrigger ref={themeTriggerRef} data-theme-trigger className="h-9">
                        <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent data-profile-theme-select-content>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                   <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/team")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Team & Roster
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/settings")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/practice-tracker")}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Practice History
                    </Button>                  
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/submit")}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit Drill
                    </Button>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => window.open("https://docs.lovable.dev", "_blank")}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Get Help
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
                      onClick={signOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile: Search Bar */}
      <div className="md:hidden border-b border-border bg-card">
        <div className="flex justify-center px-4 py-3">
          <SearchBar />
        </div>
      </div>      
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};