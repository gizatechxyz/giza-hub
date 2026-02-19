import { describe, it, expect } from "vitest";
import {
  formatToolError,
  AuthRequiredError,
  RateLimitError,
} from "../src/errors.js";

describe("formatToolError", () => {
  it("formats AuthRequiredError", () => {
    const result = formatToolError(new AuthRequiredError());
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("Authentication required");
    expect(text).toContain("generate_siwe_challenge");
  });

  it("formats RateLimitError with retry seconds", () => {
    const result = formatToolError(new RateLimitError(30));
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("Rate limit exceeded");
    expect(text).toContain("30 seconds");
  });

  it("formats GizaAPIError by name detection", () => {
    const error = new Error("Bad request");
    error.name = "GizaAPIError";
    Object.assign(error, {
      statusCode: 400,
      friendlyMessage: "Please check your parameters.",
    });
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toBe("Please check your parameters.");
  });

  it("formats ValidationError", () => {
    const error = new Error("Invalid address");
    error.name = "ValidationError";
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("Validation error");
    expect(text).toContain("Invalid address");
  });

  it("formats TimeoutError", () => {
    const error = new Error("Timed out");
    error.name = "TimeoutError";
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("timed out");
  });

  it("formats NetworkError", () => {
    const error = new Error("Connection refused");
    error.name = "NetworkError";
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("Network error");
  });

  it("formats generic Error", () => {
    const result = formatToolError(new Error("Something broke"));
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toBe("Error: Something broke");
  });

  it("formats non-Error objects", () => {
    const result = formatToolError("string error");
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toBe("An unexpected error occurred.");
  });
});
