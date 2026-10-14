import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { exerciseReference } from "@/app/lib/exercise-reference";
import references from "@/app/data/exercise-references.json";

describe("workout photo references", () => {
  it("ships local movement photos and pinned source links for every selected reference", () => {
    for (const item of references.exercises) {
      expect(item.sourceUrl).toContain(references.revision);
      expect(item.images.length).toBeGreaterThan(0);
      for (const image of item.images) expect(existsSync(resolve(`public${image}`))).toBe(true);
    }
  });
  it("keeps rowing cardio, machine rows, and dumbbell rows distinct", () => {
    expect(exerciseReference("Rowing")?.id).toBe("Rowing_Stationary");
    expect(exerciseReference("Machine rows")?.id).toBe("Leverage_Iso_Row");
    expect(exerciseReference("Dumbbell row")?.id).toBe("Bent_Over_Two-Dumbbell_Row");
    expect(exerciseReference("Cable rows")?.id).toBe("Seated_Cable_Rows");
    expect(exerciseReference("Dumbbell curls")?.id).toBe("Dumbbell_Bicep_Curl");
  });
  it("does not attach an unrelated photo to an unfamiliar custom activity", () => {
    expect(exerciseReference("My unfamiliar movement")).toBeNull();
    expect(exerciseReference("")).toBeNull();
    expect(exerciseReference("Running")?.id).toBe("Running_Treadmill");
  });
});
