"use client";
import { useEffect, useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, ImagePlus, RotateCw, ScanLine, X, Check } from "lucide-react";
import { loadLabelPhoto, cropLabelImage } from "@/app/lib/label-image";
import {
  readLabelImage,
  type LabelLanguage,
  type ReadProgress,
} from "@/app/lib/label-reader";
import {
  parseNutritionLabel,
  selectedLabelValues,
  labelFields,
  type LabelBasis,
} from "@/app/lib/nutrition-label";
export type ScannedValues = ReturnType<typeof selectedLabelValues> & {
  basis: LabelBasis;
};
const fullCrop: PercentCrop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};
const input =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-white";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:opacity-50";
export default function LabelScanner({
  disabled,
  onApply,
  onSourceChange,
}: {
  disabled: boolean;
  onApply: (values: ScannedValues) => void;
  onSourceChange: () => void;
}) {
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [crop, setCrop] = useState(fullCrop);
  const [language, setLanguage] = useState<LabelLanguage>("eng");
  const [preparing, setPreparing] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<ReadProgress>({
    status: "",
    percent: 0,
  });
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    text: string;
    confidence: number;
    parsed: ReturnType<typeof parseNutritionLabel>;
  } | null>(null);
  const [column, setColumn] = useState(0);
  const [basis, setBasis] = useState<LabelBasis | "">("");
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
    },
    [],
  );
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  function resetReadings() {
    setResult(null);
    setError("");
    setColumn(0);
    setBasis("");
    onSourceChange();
  }
  async function choose(file?: File) {
    if (!file) return;
    const token = ++generation.current;
    controller.current?.abort();
    resetReadings();
    setPhoto(null);
    setPhotoReady(false);
    setPreparing(true);
    try {
      const blob = await loadLabelPhoto(file);
      if (token === generation.current) {
        setPhoto(URL.createObjectURL(blob));
        setCrop(fullCrop);
      }
    } catch (error) {
      if (token === generation.current)
        setError(
          error instanceof Error ? error.message : "Unable to open this photo.",
        );
    } finally {
      if (token === generation.current) setPreparing(false);
    }
  }
  async function rotate() {
    if (!image.current || reading || preparing) return;
    const token = ++generation.current;
    resetReadings();
    setPreparing(true);
    try {
      const blob = await cropLabelImage(image.current, fullCrop, true);
      if (token === generation.current) {
        setPhotoReady(false);
        setPhoto(URL.createObjectURL(blob));
        setCrop(fullCrop);
      }
    } catch (error) {
      if (token === generation.current)
        setError(
          error instanceof Error
            ? error.message
            : "Unable to rotate the photo.",
        );
    } finally {
      if (token === generation.current) setPreparing(false);
    }
  }
  async function scan() {
    if (!image.current || !photoReady || reading || preparing) return;
    const token = ++generation.current;
    const abort = new AbortController();
    controller.current = abort;
    resetReadings();
    setReading(true);
    setProgress({ status: "Preparing photo", percent: 0 });
    try {
      const blob = await cropLabelImage(image.current, crop);
      const response = await readLabelImage(
        blob,
        language,
        abort.signal,
        (value) => {
          if (token === generation.current) setProgress(value);
        },
      );
      if (token === generation.current) {
        const parsed = parseNutritionLabel(response.text);
        setResult({ ...response, parsed });
        setBasis(parsed.basis ?? "");
      }
    } catch (error) {
      if (
        token === generation.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        setError(
          error instanceof Error ? error.message : "Unable to read the label.",
        );
    } finally {
      if (token === generation.current) {
        setReading(false);
        controller.current = null;
      }
    }
  }
  const values =
    result && basis ? selectedLabelValues(result.parsed, column, basis) : null;
  const usable =
    result &&
    result.confidence >= 50 &&
    values &&
    labelFields.some((field) => values[field] !== null);
  return (
    <section
      aria-label="Nutrition label scanner"
      className="col-span-full min-w-0 space-y-4 border-y border-zinc-800 py-5 [overflow-wrap:anywhere]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold">
          Scan nutrition label{" "}
          <span className="ml-2 text-xs text-yellow-500">Free</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || reading || preparing}
            onClick={() => camera.current?.click()}
            className={button}
          >
            <Camera className="h-4 w-4" />
            Take photo
          </button>
          <button
            type="button"
            disabled={disabled || reading || preparing}
            onClick={() => upload.current?.click()}
            className={button}
          >
            <ImagePlus className="h-4 w-4" />
            Upload photo
          </button>
        </div>
      </div>
      <input
        ref={camera}
        aria-label="Take nutrition label photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={upload}
        aria-label="Upload nutrition label photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className="text-xs text-zinc-400">
        Photo stays on this device. Missing or uncertain readings need your
        confirmation.
      </p>
      {preparing && (
        <p role="status" className="text-sm text-zinc-400">
          Preparing photo...
        </p>
      )}
      {photo && (
        <>
          <div className="flex h-80 items-center justify-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
            <ReactCrop
              crop={crop}
              minWidth={40}
              minHeight={40}
              disabled={disabled || reading || preparing}
              onChange={(_, percent) => {
                setCrop(percent);
                resetReadings();
              }}
            >
              {/* Browser-local image URLs must not pass through an image-optimization server. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={image}
                src={photo}
                alt="Selected nutrition label"
                onLoad={() => setPhotoReady(true)}
                onError={() => {
                  setPhotoReady(false);
                  setError(
                    "This photo could not be displayed. Choose another photo.",
                  );
                }}
                className="max-h-80 max-w-full object-contain"
              />
            </ReactCrop>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 text-sm text-zinc-400">
              Label language
              <select
                aria-label="Label language"
                disabled={reading || preparing || disabled}
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value as LabelLanguage);
                  resetReadings();
                }}
                className={input}
              >
                <option value="eng">English</option>
                <option value="eng+fra">French / English</option>
                <option value="eng+spa">Spanish / English</option>
              </select>
            </label>
            <button
              type="button"
              aria-label="Rotate label clockwise"
              title="Rotate label clockwise"
              disabled={reading || preparing || disabled || !photoReady}
              onClick={() => void rotate()}
              className={button + " h-11 w-11 px-0"}
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Remove label photo"
              title="Remove label photo"
              disabled={disabled || preparing}
              onClick={() => {
                generation.current++;
                controller.current?.abort();
                controller.current = null;
                setReading(false);
                setPhoto(null);
                resetReadings();
              }}
              className={button + " h-11 w-11 px-0"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={disabled || reading || preparing || !photoReady}
              onClick={() => void scan()}
              className={
                button +
                " border-yellow-500 bg-yellow-500 font-semibold text-black"
              }
            >
              <ScanLine className="h-4 w-4" />
              {result ? "Read label again" : "Read label"}
            </button>
            {reading && (
              <button
                type="button"
                onClick={() => controller.current?.abort()}
                className={button}
              >
                <X className="h-4 w-4" />
                Cancel scan
              </button>
            )}
          </div>
        </>
      )}
      {reading && (
        <div role="status">
          <p className="mb-2 text-sm text-zinc-400">
            {progress.status}... {progress.percent}%
          </p>
          <progress
            aria-label="Label reading progress"
            max={100}
            value={progress.percent}
            className="h-2 w-full accent-yellow-500"
          />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-4 border-t border-zinc-800 pt-4">
          <p
            className={`text-sm ${result.confidence < 70 ? "text-amber-400" : "text-zinc-400"}`}
          >
            Reading confidence: {Math.round(result.confidence)}%.{" "}
            {result.confidence < 50
              ? "Photo unclear. Retake it or enter values manually; automatic filling is disabled."
              : "Check every value against the photo."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-zinc-400">
              Label column
              <select
                aria-label="Label column"
                value={column}
                onChange={(event) => {
                  setColumn(Number(event.target.value));
                  onSourceChange();
                }}
                className={input}
              >
                {Array.from({ length: result.parsed.columns }, (_, index) => (
                  <option key={index} value={index}>
                    Column {index + 1} {index === 0 ? "(leftmost)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-400">
              Values are for
              <select
                aria-label="Values are for"
                value={basis}
                onChange={(event) => {
                  setBasis(event.target.value as LabelBasis);
                  onSourceChange();
                }}
                className={input}
              >
                <option value="">Confirm the label basis</option>
                <option value="serving">One label serving</option>
                <option value="100g">100 grams</option>
                <option value="custom">Another gram portion</option>
              </select>
            </label>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {labelFields.map((field) => (
              <div key={field}>
                <dt className="capitalize text-zinc-400">{field}</dt>
                <dd className="mt-1 font-semibold">
                  {values?.[field] ?? "Not read"}
                  {values?.[field] !== null && values?.[field] !== undefined
                    ? field === "calories"
                      ? " kcal"
                      : "g"
                    : ""}
                </dd>
              </div>
            ))}
          </dl>
          {result.parsed.warnings.length > 0 && (
            <ul className="space-y-1 text-xs text-amber-400">
              {result.parsed.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={!usable || disabled}
            onClick={() => {
              if (values && basis) onApply({ ...values, basis });
            }}
            className={button + " font-semibold text-yellow-500"}
          >
            <Check className="h-4 w-4" />
            Use detected values
          </button>
          <details className="text-xs text-zinc-400">
            <summary className="cursor-pointer">Recognized label text</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words font-sans leading-relaxed">
              {result.text || "No readable text."}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
