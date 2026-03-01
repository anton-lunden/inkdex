import assert from "node:assert";
import { describe, it } from "node:test";
import { logger } from "../../src/logger.js";

describe("logger", () => {
  it("should return a logger instance", () => {
    assert.ok(logger);
    assert.strictEqual(typeof logger.info, "function");
    assert.strictEqual(typeof logger.error, "function");
  });
});
