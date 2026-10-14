import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { digitsOnly, formatDniInput } from "./dni";

describe("formatDniInput", () => {
  it("groups from the right", () => {
    assert.equal(formatDniInput("12345678"), "12.345.678");
    assert.equal(formatDniInput("1234567"), "1.234.567");
    assert.equal(formatDniInput("123"), "123");
  });

  it("strips non-digits and caps at 8", () => {
    assert.equal(formatDniInput("12.345.678a"), "12.345.678");
    assert.equal(formatDniInput("123456789"), "12.345.678");
  });
});

describe("digitsOnly", () => {
  it("keeps digits", () => {
    assert.equal(digitsOnly("12.345.678"), "12345678");
  });
});
