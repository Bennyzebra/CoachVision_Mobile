import { strict as assert } from "node:assert";
import { test } from "node:test";

import { createAuthBootstrapController, type AuthBootstrapSession } from "./authBootstrap.ts";

const session: AuthBootstrapSession = {
  user: { id: "coach-1", email: "coach@example.com" },
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));
};

test("resolves route access before delayed profile hydration completes", async () => {
  let loading = true;
  let restoredSession: AuthBootstrapSession | null = null;
  let resolveProfile: (() => void) | undefined;
  const profileHydration = new Promise<void>((resolve) => {
    resolveProfile = resolve;
  });

  const controller = createAuthBootstrapController({
    onSessionResolved: (nextSession) => {
      restoredSession = nextSession;
      loading = false;
    },
    onProfileCleared: () => {},
    hydrateProfile: async () => profileHydration,
    onPasswordRecovery: () => {},
    onProfileHydrationError: () => {},
  });

  controller.handleSession("INITIAL_SESSION", session);

  assert.equal(loading, false);
  assert.equal(restoredSession, session);
  resolveProfile?.();
  await flushMicrotasks();
});

test("deduplicates profile hydration from session restoration and INITIAL_SESSION", async () => {
  let hydrationCount = 0;
  let resolveProfile: (() => void) | undefined;
  const profileHydration = new Promise<void>((resolve) => {
    resolveProfile = resolve;
  });
  const controller = createAuthBootstrapController({
    onSessionResolved: () => {},
    onProfileCleared: () => {},
    hydrateProfile: async () => {
      hydrationCount += 1;
      await profileHydration;
    },
    onPasswordRecovery: () => {},
    onProfileHydrationError: () => {},
  });

  controller.handleSession("INITIAL_SESSION", session);
  controller.handleSession("SIGNED_IN", session);
  await flushMicrotasks();

  assert.equal(hydrationCount, 1);
  resolveProfile?.();
  await flushMicrotasks();
});

test("clears the optional profile and resolves loading when no session exists", () => {
  let loading = true;
  let profileCleared = 0;
  const controller = createAuthBootstrapController({
    onSessionResolved: () => {
      loading = false;
    },
    onProfileCleared: () => {
      profileCleared += 1;
    },
    hydrateProfile: async () => {},
    onPasswordRecovery: () => {},
    onProfileHydrationError: () => {},
  });

  controller.handleSession("INITIAL_SESSION", null);

  assert.equal(loading, false);
  assert.equal(profileCleared, 1);
});

test("profile hydration failure does not return the app to its startup spinner", async () => {
  let loading = true;
  let reportedError: unknown;
  const controller = createAuthBootstrapController({
    onSessionResolved: () => {
      loading = false;
    },
    onProfileCleared: () => {},
    hydrateProfile: async () => {
      throw new Error("Profile service unavailable");
    },
    onPasswordRecovery: () => {},
    onProfileHydrationError: (error) => {
      reportedError = error;
    },
  });

  controller.handleSession("INITIAL_SESSION", session);
  await flushMicrotasks();

  assert.equal(loading, false);
  assert.match((reportedError as Error).message, /Profile service unavailable/);
});

test("preserves password recovery navigation", () => {
  let recoveryNavigationCount = 0;
  const controller = createAuthBootstrapController({
    onSessionResolved: () => {},
    onProfileCleared: () => {},
    hydrateProfile: async () => {},
    onPasswordRecovery: () => {
      recoveryNavigationCount += 1;
    },
    onProfileHydrationError: () => {},
  });

  controller.handleSession("PASSWORD_RECOVERY", session);

  assert.equal(recoveryNavigationCount, 1);
});
