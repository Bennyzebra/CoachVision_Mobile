import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  getMobileHeaderHideProgress,
  shouldUseMobileHeaderHideAnchor,
} from "./mobileHeaderMotion.ts";

test("keeps the mobile header still until the search card reaches the header bottom", () => {
  assert.equal(
    getMobileHeaderHideProgress({
      headerHeight: 72,
      searchCardTop: 96,
    }),
    0
  );
});

test("maps search card overlap with the header into clamped hide progress", () => {
  assert.equal(
    getMobileHeaderHideProgress({
      headerHeight: 72,
      searchCardTop: 36,
    }),
    0.5
  );

  assert.equal(
    getMobileHeaderHideProgress({
      headerHeight: 72,
      searchCardTop: -18,
    }),
    1
  );
});

test("uses the seamless mobile header anchor on AutoPlan and drill library only", () => {
  assert.equal(shouldUseMobileHeaderHideAnchor("/"), true);
  assert.equal(shouldUseMobileHeaderHideAnchor("/drills"), true);
  assert.equal(shouldUseMobileHeaderHideAnchor("/drill/123"), false);
  assert.equal(shouldUseMobileHeaderHideAnchor("/plan"), false);
});
