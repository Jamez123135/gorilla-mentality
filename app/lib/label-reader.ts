export type LabelLanguage = "eng" | "eng+fra" | "eng+spa";
export type ReadProgress = { status: string; percent: number };
const root = "/ocr/v7";
export async function readLabelImage(
  image: Blob,
  language: LabelLanguage,
  signal: AbortSignal,
  progress: (value: ReadProgress) => void,
) {
  if (signal.aborted) throw new DOMException("Scan cancelled", "AbortError");
  if (typeof Worker === "undefined" || typeof WebAssembly === "undefined")
    throw new Error(
      "This browser cannot scan labels. Manual entry remains available.",
    );
  // Own the pinned Tesseract v7 worker from startup so cancellation also stops model downloads.
  const worker = new Worker(`${root}/worker.min.js`);
  let sequence = 0;
  let stopped: Error | null = null;
  let pending: {
    id: string;
    resolve: (data: unknown) => void;
    reject: (error: Error) => void;
    status: string;
    base: number;
    span: number;
  } | null = null;
  const stop = (error: Error) => {
    stopped = error;
    worker.terminate();
    pending?.reject(error);
    pending = null;
  };
  const abort = () => stop(new DOMException("Scan cancelled", "AbortError"));
  const timeout = setTimeout(
    () =>
      stop(
        new Error(
          "Reading took too long. Retake a clear photo or enter the values manually.",
        ),
      ),
    90000,
  );
  signal.addEventListener("abort", abort, { once: true });
  worker.onerror = (event) => {
    event.preventDefault();
    stop(
      new Error(
        "The label reader could not load. Retry when connected or enter values manually.",
      ),
    );
  };
  worker.onmessage = ({ data }) => {
    if (!pending || data.jobId !== pending.id) return;
    if (data.status === "progress") {
      const value = Number(data.data?.progress);
      progress({
        status: pending.status,
        percent:
          pending.base +
          Math.round(
            Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) *
              pending.span,
          ),
      });
    } else if (data.status === "resolve") {
      const request = pending;
      pending = null;
      request.resolve(data.data);
    } else if (data.status === "reject")
      stop(
        new Error(
          "Unable to read this label. Retry a clear photo or use manual entry.",
        ),
      );
  };
  const call = (
    action: string,
    payload: unknown,
    status: string,
    base: number,
    span: number,
  ): Promise<unknown> => {
    if (signal.aborted)
      return Promise.reject(new DOMException("Scan cancelled", "AbortError"));
    if (stopped) return Promise.reject(stopped);
    progress({ status, percent: base });
    return new Promise((resolve, reject) => {
      const id = `label-${++sequence}`;
      pending = { id, resolve, reject, status, base, span };
      worker.postMessage({
        workerId: "gorilla-label",
        jobId: id,
        action,
        payload,
      });
    });
  };
  try {
    await call(
      "load",
      {
        options: {
          lstmOnly: true,
          corePath: new URL(`${root}/core`, location.origin).href,
        },
      },
      "Loading reader",
      0,
      15,
    );
    await call(
      "loadLanguage",
      {
        langs: language,
        options: {
          langPath: new URL(`${root}/lang`, location.origin).href,
          cachePath: "gorilla-label-v7",
          cacheMethod: "write",
          gzip: true,
          lstmOnly: true,
        },
      },
      "Loading language",
      15,
      25,
    );
    await call(
      "initialize",
      { langs: language, oem: 1, config: {} },
      "Preparing reader",
      40,
      15,
    );
    await call(
      "setParameters",
      {
        params: {
          tessedit_pageseg_mode: "6",
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
        },
      },
      "Preparing label",
      55,
      0,
    );
    const bytes = new Uint8Array(await image.arrayBuffer());
    const raw = await call(
      "recognize",
      { image: bytes, options: { rotateAuto: true }, output: { text: true } },
      "Reading label",
      55,
      45,
    );
    const data = raw as { text?: unknown; confidence?: unknown };
    if (typeof data.text !== "string")
      throw new Error(
        "No readable label text. Retake the photo or use manual entry.",
      );
    return {
      text: data.text.slice(0, 16000),
      confidence:
        typeof data.confidence === "number" && Number.isFinite(data.confidence)
          ? Math.max(0, Math.min(100, data.confidence))
          : 0,
    };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
    worker.terminate();
    pending = null;
  }
}
