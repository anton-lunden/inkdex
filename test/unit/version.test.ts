import assert from "node:assert";
import { describe, it } from "node:test";
import { getVersion } from "../../src/version.js";

describe("version", () => {
  it("should return a version string", () => {
    const version = getVersion();
    assert.ok(version);
    assert.strictEqual(typeof version, "string");
  });

  it("should match package.json version format", () => {
    const version = getVersion();
    assert.match(version, /^\d+\.\d+\.\d+$|^unknown$/);
  });
});
