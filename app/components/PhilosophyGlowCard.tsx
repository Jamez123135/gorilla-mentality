"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

export default function PhilosophyGlowCard() {
  const ref = useRef<HTMLDivElement | null>(null);

  // Smooth cursor glow (avoid jitter)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Tiny tilt adds depth while keeping the card readable and restrained.
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const updateFromEvent = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // cursor glow position
    setPos({ x, y });

    // tilt (subtle)
    const px = (x / rect.width) * 2 - 1; // -1..1
    const py = (y / rect.height) * 2 - 1; // -1..1
    setTilt({
      rx: clamp(py * -4, -6, 6), // rotateX
      ry: clamp(px * 5, -7, 7),  // rotateY
    });
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) return;
    const { clientX, clientY } = e;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateFromEvent(clientX, clientY);
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setActive(true);
    updateFromEvent(e.clientX, e.clientY);
  };

  const onLeave = () => {
    setActive(false);
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div className="relative [perspective:1200px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
        className="
          group relative overflow-hidden rounded-3xl
          border border-white/20
          bg-gradient-to-br from-white/[0.12] via-zinc-950 to-white/[0.08]
          p-7 md:p-10
          transition-[transform,box-shadow,border-color] duration-300
          hover:border-white/35
          hover:shadow-[0_30px_110px_-35px_rgba(255,255,255,0.55)]
          will-change-transform
        "
      >
        {/* Strong top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-[3px] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Outer glow ring for extra pop */}
        <div className="pointer-events-none absolute -inset-8 rounded-[2.2rem] bg-white/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Base glows (brighter) */}
        <div className="pointer-events-none absolute -top-36 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-white/32 blur-3xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -bottom-40 right-[-100px] h-96 w-96 rounded-full bg-white/20 blur-3xl opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Cursor glow (stronger + bigger) */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-150"
          style={{
            opacity: active ? 1 : 0,
            background: `radial-gradient(520px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.30), transparent 62%)`,
          }}
        />

        {/* Second cursor “inner” hotspot (adds depth) */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-150"
          style={{
            opacity: active ? 1 : 0,
            background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.22), transparent 60%)`,
          }}
        />

        {/* Shine sweep (stronger + faster) */}
        <div
          className="
            pointer-events-none absolute inset-0
            -translate-x-full skew-x-[-18deg]
            bg-gradient-to-r from-transparent via-white/30 to-transparent
            group-hover:translate-x-full
            transition-transform duration-900
          "
        />

        {/* Inner border */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/12" />

        {/* Content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-white">
            Gorilla Mentality - Philosophy
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-white/80" />
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Gorilla Mentality philosophy
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-100/90">
            <span className="font-semibold text-white">
              Strength is not just about size. It is discipline.
            </span>{" "}
            It is consistency, and showing up when it is hard. Gorilla Mentality is built on one
            belief: fitness is for everyone. No matter your starting point or goal: fat loss,
            muscle building, confidence, or simply moving better. This is not gatekeeping fitness.
            We train with purpose, stay locked in, and help each other grow.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/starter-pack"
              className="
                inline-flex items-center justify-center rounded-2xl
                bg-white px-5 py-3 font-semibold text-zinc-950
                transition-all duration-200
                hover:bg-zinc-200 hover:shadow-[0_18px_60px_-30px_rgba(255,255,255,0.85)]
                active:scale-[0.98]
              "
            >
              Get Free Starter Pack
            </Link>

            <Link
              href="/coaching"
              className="
                inline-flex items-center justify-center rounded-2xl
                border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white
                transition-all duration-200
                hover:bg-white/16 hover:border-white/40
                active:scale-[0.98]
              "
            >
              Apply for coaching
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
