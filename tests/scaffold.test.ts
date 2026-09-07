import { describe, expect, it } from "vitest";
import { motion, colors } from "@/lib/theme";

describe("scaffold smoke test", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });

  it("exposes the design tokens from theme.ts", () => {
    expect(motion.micro).toBeLessThanOrEqual(0.2);
    expect(motion.moment).toBeGreaterThanOrEqual(0.4);
    expect(colors.primary).toContain("var(--color-primary)");
  });
});