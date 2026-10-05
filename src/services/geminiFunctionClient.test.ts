import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createGeminiFunctionCaller } from "./geminiFunctionClient.ts";

test("Gemini function caller forwards abort signals to Supabase invoke", async () => {
  const controller = new AbortController();
  let receivedSignal: AbortSignal | undefined;

  const callGeminiFunction = createGeminiFunctionCaller(async <T>(_name, options) => {
    receivedSignal = options.signal;
    return { data: { ok: true } as T, error: null };
  });

  await callGeminiFunction("generatePracticePlan", { drills: [] }, { signal: controller.signal });

  assert.equal(receivedSignal, controller.signal);
});
