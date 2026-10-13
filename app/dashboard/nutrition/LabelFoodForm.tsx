"use client";
import { useState } from "react";
import { Save, X } from "lucide-react";
import { saveLabelFood } from "@/app/lib/actions/food-tools";
import { allergens, roles, type FoodSummary } from "@/app/lib/food-types";
import LabelScanner, { type ScannedValues } from "./LabelScanner";
import { labelFields, type LabelBasis } from "@/app/lib/nutrition-label";
import { labelFoodInput } from "@/app/lib/food-input";
const field =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-white";
export default function LabelFoodForm({
  onSaved,
  onClose,
  onBusyChange,
}: {
  onSaved: (food: FoodSummary) => void;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contains, setContains] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [numbers, setNumbers] = useState({
    servingGrams: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [basis, setBasis] = useState<LabelBasis>("serving");
  const [scanned, setScanned] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  function discardScan() {
    if (scanned) {
      setNumbers({
        servingGrams: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
      setBasis("serving");
      setScanned(false);
      setReviewed(false);
    }
  }
  function applyScan(values: ScannedValues) {
    setNumbers({
      servingGrams: values.servingGrams?.toString() ?? "",
      calories: values.calories?.toString() ?? "",
      protein: values.protein?.toString() ?? "",
      carbs: values.carbs?.toString() ?? "",
      fat: values.fat?.toString() ?? "",
    });
    setBasis(values.basis);
    setScanned(true);
    setReviewed(false);
    setReference(`Scanned nutrition label: ${name.trim() || "package label"}`);
    setError("");
  }
  return (
    <section className="my-5 border-y border-zinc-700 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Personal label food</h3>
        <button
          title="Close label form"
          aria-label="Close label form"
          disabled={busy}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = new FormData(event.currentTarget);
          setBusy(true);
          onBusyChange?.(true);
          setError("");
          try {
            if (scanned && !reviewed)
              throw new Error(
                "Confirm the label's reference weight and all detected macros before saving.",
              );
            const input = {
              name: form.get("name"),
              brand: form.get("brand"),
              reference: reference.trim() || `Package label: ${name.trim()}`,
              referenceBasis: basis,
              servingGrams: Number(form.get("servingGrams")),
              calories: Number(form.get("calories")),
              protein: Number(form.get("protein")),
              carbs: Number(form.get("carbs")),
              fat: Number(form.get("fat")),
              preparation: form.get("preparation"),
              role: form.get("role"),
              diet: form.get("diet"),
              allergens: contains,
              labelReviewed: form.get("labelReviewed") === "on",
            };
            const checked = labelFoodInput.safeParse(input);
            if (!checked.success)
              throw new Error(
                checked.error.issues[0]?.message ||
                  "Check your label values and serving weight.",
              );
            const food = await saveLabelFood(checked.data);
            onSaved(food);
            onClose();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to save this label food.",
            );
          } finally {
            setBusy(false);
            onBusyChange?.(false);
          }
        }}
      >
        <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="text-sm text-zinc-400">
            Label food name
            <input
              name="name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={field}
            />
          </label>
          <label className="text-sm text-zinc-400">
            Brand (optional)
            <input name="brand" maxLength={80} className={field} />
          </label>
          <LabelScanner
            disabled={busy}
            onApply={applyScan}
            onSourceChange={discardScan}
          />
          <p className="text-sm text-yellow-500 sm:col-span-2">
            Label values:{" "}
            {basis === "100g"
              ? "per 100 grams"
              : basis === "custom"
                ? "per entered gram reference"
                : "per label serving"}
          </p>
          <label className="text-sm text-zinc-400">
            {basis === "100g"
              ? "Label reference weight (g)"
              : "Label serving weight (g)"}
            <input
              name="servingGrams"
              type="number"
              min={0.1}
              step="any"
              max={2000}
              required
              value={numbers.servingGrams}
              readOnly={basis === "100g"}
              onChange={(event) => {
                setNumbers((current) => ({
                  ...current,
                  servingGrams: event.target.value,
                }));
                setReviewed(false);
              }}
              className={field}
            />
          </label>
          {[
            ["calories", "Label calories per serving"],
            ["protein", "Label protein per serving (g)"],
            ["carbs", "Label carbs per serving (g)"],
            ["fat", "Label fat per serving (g)"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm text-zinc-400">
              {basis === "100g"
                ? label.replace("per serving", "per 100g")
                : basis === "custom"
                  ? label.replace("per serving", "per reference portion")
                  : label}
              <input
                name={key}
                type="number"
                min={0}
                step="any"
                required
                value={numbers[key as (typeof labelFields)[number]]}
                onChange={(event) => {
                  setNumbers((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }));
                  setReviewed(false);
                }}
                className={field}
              />
            </label>
          ))}
          <label className="text-sm text-zinc-400">
            Preparation state
            <select
              name="preparation"
              aria-label="Preparation state"
              defaultValue="as described"
              className={field}
            >
              {[
                "as described",
                "raw / uncooked",
                "dry",
                "cooked",
                "ready-to-eat",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-400">
            Meal ingredient role
            <select name="role" defaultValue="other" className={field}>
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-400">
            Label dietary classification
            <select name="diet" defaultValue="unknown" className={field}>
              {["unknown", "vegan", "vegetarian", "omnivore"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-400 sm:col-span-2">
            Label reference
            <input
              name="reference"
              minLength={3}
              maxLength={240}
              placeholder="Package label, product name and serving"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className={field}
            />
          </label>
          <fieldset className="flex flex-wrap gap-4 sm:col-span-2">
            <legend className="mb-2 text-sm text-zinc-400">
              Declared allergens
            </legend>
            {allergens.map((allergen) => (
              <label
                key={allergen}
                className="flex items-center gap-2 text-sm text-zinc-400"
              >
                <input
                  type="checkbox"
                  checked={contains.includes(allergen)}
                  onChange={(event) =>
                    setContains(
                      event.target.checked
                        ? [...contains, allergen]
                        : contains.filter((value) => value !== allergen),
                    )
                  }
                  className="accent-yellow-500"
                />
                {allergen}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-zinc-400 sm:col-span-2">
            <input
              name="labelReviewed"
              type="checkbox"
              className="accent-yellow-500"
            />
            I reviewed the label&apos;s allergen declarations.
          </label>
          <p className="text-xs leading-relaxed text-zinc-500 sm:col-span-2">
            Values are based on your label entry, not independent verification.
            Check ingredients and cross-contact warnings. Historical meal totals
            remain unchanged if this entry is later removed.
          </p>
          {scanned && (
            <label className="flex items-start gap-2 text-sm text-amber-400 sm:col-span-2">
              <input
                type="checkbox"
                required
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
                className="mt-1 accent-yellow-500"
              />
              I checked the reference weight and every detected macro against
              the photo.
            </label>
          )}
          <button
            disabled={scanned && !reviewed}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 p-3 font-bold text-black disabled:opacity-50 sm:col-span-2"
          >
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : "Save label food"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
