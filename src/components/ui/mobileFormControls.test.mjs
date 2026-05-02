import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("mobile form controls use iOS-safe font sizes", () => {
  const textareaSource = readSource("./textarea.tsx");
  const selectSource = readSource("./select.tsx");
  const commandSource = readSource("./command.tsx");

  assert.match(textareaSource, /text-base[\s\S]*md:text-sm/);
  assert.match(selectSource, /text-base[\s\S]*md:text-sm/);
  assert.match(commandSource, /text-base[\s\S]*md:text-sm/);
});

test("global mobile CSS protects against iOS focus zoom and horizontal drift", () => {
  const cssSource = readSource("../../index.css");

  assert.match(cssSource, /max-width:\s*100vw/);
  assert.match(cssSource, /overflow-x:\s*(?:hidden|clip)/);
  assert.match(cssSource, /@media\s*\(max-width:\s*767px\)/);
  assert.match(cssSource, /input[\s\S]*textarea[\s\S]*select[\s\S]*font-size:\s*16px/);
});

test("AutoPlan search focus styling does not scale the viewport", () => {
  const autoPlanSource = readSource("../../pages/AutoPlan.tsx");

  assert.doesNotMatch(autoPlanSource, /focus-visible:scale-\[/);
});
