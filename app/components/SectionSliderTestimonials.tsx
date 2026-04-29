"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TestimonialCard, { Testimonial } from "./TestimonialCard";

type Props = {
  heading?: string;
  subHeading?: string;
  testimonials: Testimonial[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SectionSliderTestimonials({
  heading = "Loved by the community",
  subHeading = "Real words from people training with Gorilla Mentality",
  testimonials,
}: Props) {
  const [perView, setPerView] = useState(1);
  const [page, setPage] = useState(0);

  // Responsive items per view (no extra libs)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setPerView(1);        // mobile
      else if (w < 1024) setPerView(2);  // tablet
      else setPerView(3);                // desktop
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(testimonials.length / perView));
  }, [testimonials.length, perView]);

  const safePage = clamp(page, 0, pageCount - 1);

  const canPrev = safePage > 0;
  const canNext = safePage < pageCount - 1;

  // Each page moves by 100% of the viewport width
  const x = `-${safePage * 100}%`;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-16">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold">{heading}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300">{subHeading}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => canPrev && setPage(safePage - 1)}
            disabled={!canPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-900 disabled:opacity-40"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => canNext && setPage(safePage + 1)}
            disabled={!canNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-900 disabled:opacity-40"
            aria-label="Next testimonials"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mt-8 overflow-hidden">
        <motion.div
          animate={{ x }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="flex"
          style={{ width: `${pageCount * 100}%` }}
        >
          {/* Build pages */}
          {Array.from({ length: pageCount }).map((_, pageIndex) => {
            const start = pageIndex * perView;
            const slice = testimonials.slice(start, start + perView);

            return (
              <div
                key={pageIndex}
                className="grid w-full gap-4"
                style={{
                  width: `${100 / pageCount}%`,
                  gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))`,
                }}
              >
                {slice.map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}

                {/* If last page has fewer items, fill empty slots to keep layout neat */}
                {slice.length < perView &&
                  Array.from({ length: perView - slice.length }).map((__, i) => (
                    <div key={`empty-${i}`} className="hidden lg:block" />
                  ))}
              </div>
            );
          })}
        </motion.div>

        {/* Dots */}
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-2.5 w-2.5 rounded-full border border-zinc-700 ${
                i === safePage ? "bg-zinc-50" : "bg-zinc-900"
              }`}
              aria-label={`Go to testimonials page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
