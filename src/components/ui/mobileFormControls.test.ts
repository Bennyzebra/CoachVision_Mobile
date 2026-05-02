import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("shared form controls use mobile-safe type before desktop downshifting", () => {
  const textareaSource = readSource("./textarea.tsx");
  const selectSource = readSource("./select.tsx");
  const commandSource = readSource("./command.tsx");

  assert.match(textareaSource, /text-base[^"]*md:text-sm/);
  assert.match(selectSource, /SelectPrimitive\.Trigger[\s\S]*text-base[^"]*md:text-sm/);
  assert.match(selectSource, /SelectPrimitive\.Item[\s\S]*text-base[^"]*md:text-sm/);
  assert.match(commandSource, /CommandPrimitive\.Input[\s\S]*text-base[^"]*md:text-sm/);
});

test("mobile css protects small native form controls without targeting large controls", () => {
  const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");

  assert.match(cssSource, /html,\s*body,\s*#root\s*\{[\s\S]*max-width: 100%[\s\S]*overflow-x: hidden/);
  assert.match(cssSource, /@supports \(overflow: clip\)[\s\S]*html,\s*body,\s*#root\s*\{[\s\S]*overflow-x: clip/);
  assert.match(cssSource, /@media \(max-width: 767px\)[\s\S]*:where\(input, textarea, select\):where\(\.text-xs, \.text-sm\)/);
  assert.match(cssSource, /font-size: 16px/);
  assert.doesNotMatch(cssSource, /:where\(input, textarea, select\):where\([^)]*md\\:text-sm/);
});

test("AutoPlan search input keeps focus feedback without focus-time scaling", () => {
  const autoPlanSource = readFileSync(new URL("../../pages/AutoPlan.tsx", import.meta.url), "utf8");
  const searchInputClass = autoPlanSource.match(
    /className="([^"]*hover:border-primary\/40[^"]*)"/,
  )?.[1];

  assert.ok(searchInputClass, "AutoPlan search input class should be found");
  assert.doesNotMatch(searchInputClass, /focus-visible:scale/);
  assert.match(searchInputClass, /focus-visible:border-primary\/40/);
  assert.match(searchInputClass, /focus-visible:shadow-md/);
});
