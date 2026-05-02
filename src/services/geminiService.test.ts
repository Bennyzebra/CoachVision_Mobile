import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createGeminiFunctionCaller } from "./geminiFunctionClient.ts";

test("callGeminiFunction sends the expected action and payload", async () => {
  let receivedName: string | undefined;
  let receivedOptions: { body?: unknown } | undefined;

  const callGeminiFunction = createGeminiFunctionCaller(async (name, options) => {
    receivedName = name;
    receivedOptions = options;
    return { data: { ok: true }, error: null };
  });

  const result = await callGeminiFunction<{ ok: boolean }>("summarizeIntentForPlanning", {
    searchText: "press break for 60 minutes",
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(receivedName, "gemini");
  assert.deepEqual(receivedOptions?.body, {
    action: "summarizeIntentForPlanning",
    payload: { searchText: "press break for 60 minutes" },
  });
});

test("callGeminiFunction throws the server error message", async () => {
  const callGeminiFunction = createGeminiFunctionCaller(async () => ({
    data: null,
    error: {
      message: "Edge Function returned a non-2xx status code",
      context: new Response(JSON.stringify({ error: "Gemini API key is not configured." }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    },
  }));

  await assert.rejects(
    () => callGeminiFunction("generatePracticePlan", { coachRequirements: {}, availableDrills: [] }),
    /Gemini API key is not configured\./
  );
});
