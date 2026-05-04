import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Crown, Sparkles } from "lucide-react";

type BillingCycle = "monthly" | "yearly";

const premiumFeatures = [
  "Designed for coaches managing multiple teams",
  "Up to 2 active teams",
  "Unlimited practice plans",
  "Priority AI suggestions with richer feedback",
  "Advanced drill filters & practice templates",
  "Priority customer support",
];

const proFeatures = [
  "Built for schools, clubs, and athletic programs",
  "Supports up to 8 teams",
  "All Premium features included",
  "Organization Admin Dashboard",
  "Shared drill libraries across teams",
  "Team-level analytics & internal moderation",
];

const formatPrice = (billing: BillingCycle, monthly: number, yearly: number) =>
  billing === "monthly" ? `$${monthly}/month` : `$${yearly} per year`;

const UpgradePage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const priceCopy = useMemo(
    () => ({
      premium: formatPrice(billingCycle, 20, 180),
      pro: formatPrice(billingCycle, 50, 400),
      subCopy:
        billingCycle === "monthly" ? "Switch to annual and save" : "Billed annually",
    }),
    [billingCycle]
  );

  const handleSelectPlan = (plan: "Premium" | "Pro") => {
    navigate("/settings", {
      state: { selectedPlan: plan, billingCycle },
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Upgrade to unlock AI-powered planning at scale
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Choose your CoachVision plan</h1>
            <p className="text-muted-foreground max-w-2xl">
              Compare plans built for high-performing coaches and athletic programs. Pick monthly
              or annual billing to fit your season schedule.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border px-4 py-2 bg-muted/40">
            <span className="text-sm font-medium">Monthly</span>
            <Switch
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            />
            <span className="text-sm font-medium">Annual (save)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Plus</CardTitle>
              <p className="text-muted-foreground text-sm">
                Deeper analytics and smarter AI planning for multi-team coaches.
              </p>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              Popular
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{priceCopy.premium}</div>
              <div className="text-sm text-muted-foreground">{priceCopy.subCopy}</div>
            </div>
            <ul className="space-y-2 text-sm">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => handleSelectPlan("Premium")}>
              Choose Plus
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Pro</CardTitle>
              <p className="text-muted-foreground text-sm">
                Scalable oversight for schools, clubs, and athletic programs managing many teams.
              </p>
            </div>
            <Badge className="gap-1">
              <Crown className="h-4 w-4" />
              Best value
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{priceCopy.pro}</div>
              <div className="text-sm text-muted-foreground">{priceCopy.subCopy}</div>
            </div>
            <ul className="space-y-2 text-sm">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="secondary" onClick={() => handleSelectPlan("Pro")}>
              Choose Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpgradePage;