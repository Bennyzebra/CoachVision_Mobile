import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getMobileHeaderHideProgress } from "./mobileHeaderMotion.ts";

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
