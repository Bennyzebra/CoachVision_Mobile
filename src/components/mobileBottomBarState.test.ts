import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getMobileBottomBarState } from "./mobileBottomBarState.ts";

const routes = [
  ["/", "Generate Practice Plan", "autoplan"],
  ["/drills", "Discover Drills", "drills"],
  ["/discover", "Discover Drills", "drills"],
  ["/drill/123", "Drill Details", "drill"],
  ["/plan/123", "Practice Plan", "plan"],
  ["/run/123", "Run Practice", "run"],
  ["/practice-tracker", "Practice History", "practice-tracker"],
  ["/settings", "Settings", "settings"],
  ["/team", "Team & Roster", "team"],
  ["/onboarding", "Create Team", "create-team"],
  ["/unknown", "CoachVision", "default"],
] as const;

test("maps the mobile lower bar routes to the expected labels", () => {
  for (const [pathname, label, routeKey] of routes) {
    const state = getMobileBottomBarState(pathname);
    assert.equal(state.label, label, pathname);
    assert.equal(state.routeKey, routeKey, pathname);
  }
});

test("keeps the mobile lower bar width stable across route states", () => {
  const widths = new Set(routes.map(([pathname]) => getMobileBottomBarState(pathname).widthClass));
  assert.deepEqual([...widths], ["w-[19rem] max-w-[calc(100vw-2rem)]"]);
});
