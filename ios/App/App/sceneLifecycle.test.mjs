import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const appDir = new URL("./", import.meta.url);
const projectDir = new URL("../App.xcodeproj/project.pbxproj", appDir);

test("iOS app declares a UIKit scene lifecycle delegate", () => {
  const infoPlist = readFileSync(new URL("Info.plist", appDir), "utf8");
  const sceneDelegatePath = new URL("SceneDelegate.swift", appDir);
  const project = readFileSync(projectDir, "utf8");

  assert.ok(existsSync(sceneDelegatePath), "SceneDelegate.swift should exist");
  assert.match(infoPlist, /<key>UIApplicationSceneManifest<\/key>/);
  assert.match(infoPlist, /<key>UISceneDelegateClassName<\/key>\s*<string>\$\(PRODUCT_MODULE_NAME\)\.SceneDelegate<\/string>/);
  assert.match(infoPlist, /<key>UISceneStoryboardFile<\/key>\s*<string>Main<\/string>/);
  assert.match(project, /SceneDelegate\.swift in Sources/);
});
