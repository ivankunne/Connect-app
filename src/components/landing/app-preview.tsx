"use client";

import { motion } from "framer-motion";

// A faithful mini-mock of the real app — communities rail + a live conversation.
// Shows the product instead of describing it (Community/Forum landing pattern).

const COMMUNITIES = [
  { flag: "🇪🇸", name: "Spanish in Bergen", active: true },
  { flag: "🇳🇴", name: "Norway - Bergen" },
  { flag: "🌍", name: "Global" },
];

const MESSAGES = [
  {
    initials: "LM",
    color: "oklch(0.7 0.13 34)",
    name: "Lucía",
    flag: "🇪🇸",
    time: "09:41",
    text: "Noen som vet hvor man finner ordentlig jamón i Bergen? 😍",
  },
  {
    initials: "TK",
    color: "oklch(0.7 0.13 195)",
    name: "Tomasz",
    flag: "🇵🇱",
    time: "09:43",
    text: "Delikatessen på Torgallmenningen! Har til og med manchego.",
  },
  {
    initials: "AM",
    color: "oklch(0.7 0.13 285)",
    name: "Ana",
    flag: "🇪🇸",
    time: "09:44",
    text: "Perfekt. Tapas-kveld på torsdag da? 🥘",
  },
];

export function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md"
    >
      {/* soft glow behind */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, oklch(0.66 0.17 34 / 0.35), transparent)" }}
      />
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-card shadow-2xl shadow-black/15 ring-1 ring-black/5">
        <div className="flex h-[22rem]">
          {/* Communities rail */}
          <div className="hidden w-36 shrink-0 flex-col gap-1 bg-sidebar p-2.5 sm:flex">
            <div className="px-1.5 pb-1 text-[0.6rem] font-semibold uppercase tracking-wider text-sidebar-muted">
              Fellesskap
            </div>
            {COMMUNITIES.map((c) => (
              <div
                key={c.name}
                className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 ${
                  c.active ? "bg-white/12" : ""
                }`}
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-white/10 text-xs">
                  {c.flag}
                </span>
                <span className="truncate text-[0.7rem] font-medium text-sidebar-foreground/90">
                  {c.name}
                </span>
              </div>
            ))}
          </div>

          {/* Chat */}
          <div className="flex min-w-0 flex-1 flex-col bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <span className="text-base">🇪🇸</span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">Spanish in Bergen</div>
                <div className="flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  128 medlemmer
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-hidden px-3.5 py-3">
              {MESSAGES.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.35, duration: 0.4 }}
                  className="flex gap-2"
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-bold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[0.7rem] font-semibold">{m.name}</span>
                      <span className="text-[0.6rem]">{m.flag}</span>
                      <span className="text-[0.55rem] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="text-[0.72rem] leading-snug text-foreground/85">{m.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-3.5 pb-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span className="text-[0.72rem] text-muted-foreground">Skriv en melding…</span>
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg viewBox="0 0 24 24" fill="none" className="size-3">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating "event" card, overlapping */}
      <motion.div
        initial={{ opacity: 0, y: 12, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-6 -right-3 w-44 rounded-xl border border-border bg-card p-3 shadow-xl sm:-right-8"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/12 text-primary">
            <span className="text-sm font-bold leading-none">14</span>
            <span className="text-[0.5rem] uppercase">nov</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[0.72rem] font-semibold">Tapas-kveld</div>
            <div className="text-[0.6rem] text-muted-foreground">9 deltar · Bergen</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
