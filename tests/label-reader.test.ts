import { afterEach, describe, expect, it, vi } from "vitest";
import { readLabelImage } from "@/app/lib/label-reader";
const workers: FakeWorker[] = [];
class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { preventDefault: () => void }) => void) | null = null;
  stopped = false;
  actions: string[] = [];
  fail = "";
  wait = false;
  constructor(public url: string) {
    workers.push(this);
  }
  terminate() {
    this.stopped = true;
  }
  postMessage(message: { jobId: string; action: string }) {
    this.actions.push(message.action);
    if (this.wait) return;
    queueMicrotask(() => {
      if (!this.stopped)
        this.onmessage?.({
          data: {
            jobId: message.jobId,
            status: this.fail === message.action ? "reject" : "resolve",
            data:
              message.action === "recognize"
                ? { text: "Calories 200", confidence: 90 }
                : { loaded: true },
          },
        });
    });
  }
}
afterEach(() => {
  workers.length = 0;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const setup = () => {
  vi.stubGlobal("Worker", FakeWorker);
  vi.stubGlobal("location", { origin: "http://localhost:3000" });
};
describe("on-device label worker lifecycle", () => {
  it("loads the pinned worker and terminates after success", async () => {
    setup();
    const result = await readLabelImage(
      new Blob(["photo"]),
      "eng",
      new AbortController().signal,
      () => {},
    );
    expect(result).toEqual({ text: "Calories 200", confidence: 90 });
    expect(workers[0].url).toBe("/ocr/v7/worker.min.js");
    expect(workers[0].actions).toEqual([
      "load",
      "loadLanguage",
      "initialize",
      "setParameters",
      "recognize",
    ]);
    expect(workers[0].stopped).toBe(true);
  });
  it("terminates even when cancelled during initial engine loading", async () => {
    setup();
    const controller = new AbortController();
    const pending = readLabelImage(
      new Blob(["photo"]),
      "eng",
      controller.signal,
      () => {},
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(workers[0].stopped).toBe(true);
  });
  it("rejects failed language downloads and cleans up", async () => {
    setup();
    const pending = readLabelImage(
      new Blob(["photo"]),
      "eng",
      new AbortController().signal,
      () => {},
    );
    workers[0].fail = "loadLanguage";
    await expect(pending).rejects.toThrow(/manual entry/);
    expect(workers[0].stopped).toBe(true);
  });
  it("times out stalled initialization and rejects already-aborted calls", async () => {
    setup();
    vi.useFakeTimers();
    const pending = readLabelImage(
      new Blob(["photo"]),
      "eng",
      new AbortController().signal,
      () => {},
    );
    workers[0].wait = true;
    const assertion = expect(pending).rejects.toThrow(/too long/);
    await vi.advanceTimersByTimeAsync(90000);
    await assertion;
    expect(workers[0].stopped).toBe(true);
    const controller = new AbortController();
    controller.abort();
    await expect(
      readLabelImage(new Blob(), "eng", controller.signal, () => {}),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
