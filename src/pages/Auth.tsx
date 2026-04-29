import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/CoachVision_Final.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [coachName, setCoachName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
        navigate("/");
      } else {
        const trimmedCoachName = coachName.trim() || "Coach";

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              coach_name: trimmedCoachName,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        const userId = data?.user?.id;

        if (userId) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                coach_name: trimmedCoachName,
                email,
              },
              {
                onConflict: "id",
              }
            );

          if (profileError && profileError.code !== "23505") {
            throw profileError;
          }

          const { error: coachProfileError } = await supabase
            .from("coach_profiles")
            .upsert(
              {
                id: userId,
                coach_name: trimmedCoachName,
                email,
              },
              {
                onConflict: "id",
              }
            );

          if (coachProfileError && coachProfileError.code !== "23505") {
            throw coachProfileError;
          }
        }
        toast({
          title: "Account created!",
          description: "Launching your onboarding tour...",
        });
        navigate("/onboarding");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Enter your email above to receive reset instructions.",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent",
        description: "Check your inbox for a password reset link.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to send reset instructions right now.";

      toast({
        title: "Couldn't send reset email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };  
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4 pt-2 text-left">
        <img src={logo} alt="CoachVision" className="h-72 w-auto mx-auto mb-0" />
          <CardTitle
            className={
              isLogin
                ? "mb-0 text-[1.65rem] font-normal leading-none text-white"
              : "mb-1"
            }
          >
            {isLogin ? "Welcome to CoachVision" : "Join CoachVision"}
          </CardTitle>
          {isLogin && (
            <p className="-mt-1 text-[1.3rem] leading-tight text-white/60">
      Plan in minutes. Practice smarter. Win more.
            </p>
    )}
          {!isLogin && (
            <CardDescription>
              Sign up to start optimizing your practices and team
            </CardDescription>
          )}
      </CardHeader>
          <CardContent className="pt-0 pb-3">
          <Button
            type="button"
            className="w-full gap-2"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            >
            <span className="inline-flex h-5 w-5 items-center justify-center">
              {googleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
              ) : (
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 48 48"
                  className="h-4 w-4"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.47 1.23 8.87 3.24l6.59-6.59C35.07 2.09 29.87 0 24 0 14.62 0 6.37 5.38 2.48 13.19l7.69 5.96C12.01 12.38 17.57 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.7-.15-3.33-.43-4.9H24v9.28h12.66c-.55 2.97-2.2 5.49-4.67 7.2l7.14 5.55C43.83 37.4 46.5 31.4 46.5 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.17 28.15a14.5 14.5 0 0 1 0-8.3l-7.69-5.96A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.48 10.81l7.69-5.96z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.92-2.13 15.89-5.77l-7.14-5.55c-1.98 1.33-4.52 2.12-8.75 2.12-6.43 0-11.99-2.88-13.83-9.65l-7.69 5.96C6.37 42.62 14.62 48 24 48z"
                  />
                </svg>
              )}
            </span>            
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>          
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="coachName">Coach Name</Label>
                <Input
                  id="coachName"
                  type="text"
                  placeholder="John Smith"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="coach@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading || loading || googleLoading}
                  className="mt-2 text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotPasswordLoading ? "Sending reset link..." : "Forgot password?"}
                </button>
              )}              
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
