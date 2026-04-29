"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt = "Before and after",
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastClientXRef = useRef<number | null>(null);

  const [pct, setPct] = useState(50);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX - rect.left;
    const nextPct = (x / rect.width) * 100;
    setPct(clamp(nextPct, 5, 95));
  }, []);

  // Smooth updates using RAF (prevents jitter)
  const scheduleUpdate = useCallback((clientX: number) => {
    lastClientXRef.current = clientX;
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const cx = lastClientXRef.current;
      if (cx == null) return;
      setFromClientX(cx);
    });
  }, [setFromClientX]);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    // Prevent page scrolling on touch while dragging
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    scheduleUpdate(e.clientX);
  };

  // Global move/up so drag keeps working outside the element
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      scheduleUpdate(e.clientX);
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  return (
    <div
      ref={wrapRef}
      className="
        relative overflow-hidden rounded-2xl
        border border-white/10 bg-zinc-950
        aspect-[16/10]
        select-none
      "
      style={{ touchAction: "none" }} // critical for mobile drag
      onPointerDown={onPointerDown}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPct((p) => clamp(p - 3, 5, 95));
        if (e.key === "ArrowRight") setPct((p) => clamp(p + 3, 5, 95));
      }}
    >
      {/* BEFORE */}
      <Image
        src={beforeSrc}
        alt={`${alt} - before`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        priority={false}
      />

      {/* AFTER (clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        <Image
          src={afterSrc}
          alt={`${alt} - after`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={false}
        />
      </div>

      {/* Labels */}
      <div className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] text-white">
        Before
      </div>
      <div className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] text-white">
        After
      </div>

      {/* Divider line */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-white/80"
        style={{ left: `calc(${pct}% - 1px)` }}
      />

      {/* Handle (bigger + easier to grab) */}
      <div
        className="
          absolute top-1/2 -translate-y-1/2
          h-12 w-12 rounded-full
          border border-white/35 bg-zinc-950/60 backdrop-blur
          flex items-center justify-center
          shadow-[0_14px_40px_-18px_rgba(255,255,255,0.75)]
          cursor-ew-resize
        "
        style={{ left: `calc(${pct}% - 24px)` }}
      >
        <div className="flex items-center gap-1">
          <span className="h-5 w-[2px] rounded bg-white/90" />
          <span className="h-5 w-[2px] rounded bg-white/90" />
          <span className="h-5 w-[2px] rounded bg-white/90" />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] text-white/90">
        Drag or click to compare
      </div>
    </div>
  );
}
