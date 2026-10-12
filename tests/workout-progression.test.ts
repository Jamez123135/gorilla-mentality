import { describe, expect, it } from "vitest";
import { getProgression, nextTrainingDay } from "@/app/lib/workout-progression";
import { exerciseDefaults } from "@/app/lib/workout-plan";

function session(date: string, reps: number, weight = 100, completed = true) {
  return Array.from({ length: 3 }, (_, index) => ({
    weight,
    reps,
    isCompleted: completed,
    setNumber: index + 1,
    workoutDate: new Date(date),
  }));
}
describe("adaptive targets", () => {
  it("increases load only after two complete exercise sessions above the target", () => {
    const result = getProgression("8-12", 3, [
      ...session("2026-10-10", 13),
      ...session("2026-10-05", 13),
    ]);
    expect(result.weight).toBe(102.5);
    expect(result.reps).toBe("8-12");
  });
  it("builds reps before increasing load", () => {
    const result = getProgression("8-12", 3, session("2026-10-10", 10));
    expect(result.weight).toBe(100);
    expect(result.reps).toBe("11");
  });
  it("rounds working-load increments up without getting stuck below two percent", () => {
    const result = getProgression("8-12", 3, [
      ...session("2026-10-10", 13, 135),
      ...session("2026-10-05", 13, 135),
    ]);
    expect(result.weight).toBe(140);
  });
  it("does not escalate from unchecked or partial sets", () => {
    expect(
      getProgression("8-12", 3, session("2026-10-10", 15, 100, false)).weight,
    ).toBeNull();
    const result = getProgression(
      "8-12",
      3,
      session("2026-10-10", 15).slice(0, 1),
    );
    expect(result.weight).toBe(100);
    expect(result.reps).toBe("8-12");
  });
  it("reduces load after a too-heavy check-in", () => {
    const result = getProgression(
      "8-12",
      3,
      session("2026-10-10", 10),
      "too-heavy",
    );
    expect(result.weight).toBe(95);
  });
  it("does not recommend an oversized increment for light loads", () => {
    const result = getProgression("8-12", 3, [
      ...session("2026-10-10", 13, 20),
      ...session("2026-10-05", 13, 20),
    ]);
    expect(result.weight).toBe(20);
  });
  it("does not apply weighted progression to timed holds", () => {
    expect(
      getProgression("30-45 sec", 3, session("2026-10-10", 45)).weight,
    ).toBeNull();
  });
  it("parses the routine's actual set and rep formats", () => {
    expect(exerciseDefaults("4 sets x 6-10 reps")).toEqual({
      sets: 4,
      reps: "6-10",
    });
    expect(exerciseDefaults("3 x 10-12, controlled")).toEqual({
      sets: 3,
      reps: "10-12",
    });
    expect(exerciseDefaults("3 rounds x 30-45 sec")).toEqual({
      sets: 3,
      reps: "30-45 sec",
    });
  });
  it("cycles through the chosen training split", () => {
    expect(nextTrainingDay(undefined, 4)).toBe(1);
    expect(nextTrainingDay(1, 4)).toBe(2);
    expect(nextTrainingDay(4, 4)).toBe(1);
    expect(nextTrainingDay(6, 3)).toBe(1);
  });
});
