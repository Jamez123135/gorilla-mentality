"use client";

import React, { useRef, useState } from "react";
import { Star } from "lucide-react";
import BeforeAfterSlider from "./BeforeAfterSlider";

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  beforeImg?: string;
  afterImg?: string;
};

export default function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const hasProgress = !!testimonial.beforeImg && !!testimonial.afterImg;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className="
        group relative h-full min-h-[340px] md:min-h-[440px]
        overflow-hidden rounded-3xl
        border border-white/12
        bg-gradient-to-br from-white/[0.08] via-zinc-950 to-white/[0.04]
        p-7 md:p-8
        transition-all duration-300
        hover:-translate-y-2 hover:border-white/25
        hover:shadow-[0_22px_70px_-25px_rgba(255,255,255,0.30)]
      "
    >
      {/* Top highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-[2px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Base glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-white/18 blur-3xl opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.18), transparent 60%)`,
        }}
      />

      {/* Shine sweep */}
      <div
        className="
          pointer-events-none absolute inset-0
          -translate-x-full skew-x-[-18deg]
          bg-gradient-to-r from-transparent via-white/14 to-transparent
          group-hover:translate-x-full
          transition-transform duration-1000
        "
      />

      {/* Inner border ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between">
        <div>
          {/* Rating row */}
          <div className="flex items-center gap-1">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-white text-white/90" />
            ))}
            <span className="ml-2 text-xs text-zinc-300">
              {testimonial.rating}.0
            </span>

            {hasProgress && (
              <span className="ml-auto inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/90">
                Progress
              </span>
            )}
          </div>

          {/* Progress media appears only for testimonials with before/after images. */}
          {hasProgress && (
            <div className="mt-4">
              <BeforeAfterSlider
                beforeSrc={testimonial.beforeImg!}
                afterSrc={testimonial.afterImg!}
                alt={`${testimonial.name} progress`}
              />
            </div>
          )}

          {/* Quote */}
          <p className="mt-5 text-base leading-relaxed text-zinc-200">
            &quot;{testimonial.quote}&quot;
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-white">{testimonial.name}</p>
          <p className="text-xs text-zinc-300">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}
