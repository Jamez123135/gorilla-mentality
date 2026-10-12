"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Trash2, Upload } from "lucide-react";
import { requestJson } from "@/app/lib/http";
import { preparePhoto } from "@/app/lib/prepare-photo";
import type { ProgressPhoto } from "@/app/types/dashboard";
import { WeightTracker } from "./WeightTracker";

export default function ProgressVault() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    requestJson<ProgressPhoto[]>("/api/progress")
      .then((data) => {
        if (active) setPhotos(data);
      })
      .catch(() => {
        if (active)
          setError("Unable to load your photos. Please refresh to try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("photo", await preparePhoto(file), "progress.jpg");
      const photo = await requestJson<ProgressPhoto>("/api/progress", {
        method: "POST",
        body,
      });
      setPhotos((current) => [photo, ...current]);
      setMessage("Photo saved.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(id: string) {
    if (deleting || !window.confirm("Delete this progress photo?")) return;
    setDeleting(id);
    setError(null);
    setMessage(null);
    try {
      await requestJson(`/api/progress/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setPhotos((current) => current.filter((photo) => photo.id !== id));
      setMessage("Photo deleted.");
    } catch {
      setError("Unable to delete this photo. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Progress <span className="text-yellow-500">Vault</span>
          </h1>
          <p className="mt-2 text-zinc-400">
            Your transformation, one photo at a time.
          </p>
        </div>
        <label
          className={`flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black cursor-pointer ${uploading || loading ? "opacity-50" : "hover:bg-yellow-400"}`}
        >
          <Upload className="h-5 w-5" />
          {uploading ? "Uploading..." : "Add Photo"}
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || loading}
            onChange={handleUpload}
            aria-label="Add progress photo"
          />
        </label>
      </header>
      <WeightTracker />
      <h2 className="mb-4 text-xl font-semibold">Progress Photos</h2>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-green-400">
          {message}
        </p>
      )}
      {loading ? (
        <p role="status" className="text-zinc-400">
          Loading photos...
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {!photos.length && !error && (
            <div className="col-span-full py-16 text-center text-zinc-400">
              <Camera className="mx-auto mb-4 h-12 w-12" />
              <p>Your vault is empty.</p>
            </div>
          )}
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
            >
              <div className="relative aspect-square">
                <Image
                  unoptimized
                  src={photo.url}
                  alt={photo.label || "Progress photo"}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-2 p-3 text-sm text-zinc-400">
                <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => removePhoto(photo.id)}
                  disabled={deleting !== null}
                  aria-label="Delete progress photo"
                  title="Delete photo"
                  className="shrink-0 rounded-lg p-2 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
