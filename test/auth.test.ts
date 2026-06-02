import { describe, expect, it } from "vitest";
import { isPasswordValid } from "@/lib/auth";

describe("isPasswordValid", () => {
  it("accepts matching non-empty passwords", () => {
    expect(isPasswordValid("secret", "secret")).toBe(true);
  });

  it("rejects empty or mismatched passwords", () => {
    expect(isPasswordValid("", "secret")).toBe(false);
    expect(isPasswordValid("wrong", "secret")).toBe(false);
  });

  it("allows access when no password is configured", () => {
    expect(isPasswordValid("", "")).toBe(true);
    expect(isPasswordValid("", undefined)).toBe(true);
  });
});
