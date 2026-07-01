"use client";

import { motion } from "framer-motion";

const BUBBLES = [
  { label: "🇪🇸 Spanish in Bergen", x: "6%", y: "12%", delay: 0 },
  { label: "🌍 Global", x: "62%", y: "4%", delay: 0.4 },
  { label: "🇳🇴 Norway", x: "70%", y: "44%", delay: 0.8 },
  { label: "🇵🇱 Polish in Norway", x: "2%", y: "58%", delay: 0.6 },
  { label: "🏘️ Norway - Oslo", x: "44%", y: "70%", delay: 1.0 },
  { label: "🇩🇪 German in Norway", x: "40%", y: "30%", delay: 0.2 },
];

export function HeroVisual() {
  return (
    <div className="relative h-72 w-full sm:h-96">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.66 0.17 34 / 0.5), transparent 70%)" }}
      />
      {BUBBLES.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: b.delay },
            scale: { duration: 0.5, delay: b.delay },
            y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: b.delay },
          }}
          className="absolute rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg"
          style={{ left: b.x, top: b.y }}
        >
          {b.label}
        </motion.div>
      ))}
    </div>
  );
}
