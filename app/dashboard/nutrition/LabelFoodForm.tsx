"use client";
import { useState } from "react";
import { Save, X } from "lucide-react";
import { saveLabelFood } from "@/app/lib/actions/food-tools";
import { allergens, roles, type FoodSummary } from "@/app/lib/food-types";
const field =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-white";
export default function LabelFoodForm({
  onSaved,
  onClose,
}: {
  onSaved: (food: FoodSummary) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contains, setContains] = useState<string[]>([]);
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
          const form = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            const food = await saveLabelFood({
              name: form.get("name"),
              brand: form.get("brand"),
              reference: form.get("reference"),
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
            });
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
          }
        }}
      >
        <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="text-sm text-zinc-400">
            Label food name
            <input name="name" required maxLength={120} className={field} />
          </label>
          <label className="text-sm text-zinc-400">
            Brand (optional)
            <input name="brand" maxLength={80} className={field} />
          </label>
          <label className="text-sm text-zinc-400">
            Label serving weight (g)
            <input
              name="servingGrams"
              type="number"
              min={0.1}
              step="any"
              max={2000}
              required
              className={field}
            />
          </label>
          {[
            ["calories", "Label calories per serving"],
            ["protein", "Label protein per serving (g)"],
            ["carbs", "Label carbs per serving (g)"],
            ["fat", "Label fat per serving (g)"],
          ].map(([name, label]) => (
            <label key={name} className="text-sm text-zinc-400">
              {label}
              <input
                name={name}
                type="number"
                min={0}
                step="any"
                required
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
              required
              minLength={3}
              maxLength={240}
              placeholder="Package label, product name and serving"
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
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 p-3 font-bold text-black sm:col-span-2">
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : "Save label food"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
