import Link from "next/link";
import { HomeLinkMark } from "@/components/brand";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand / story panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between p-10">
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.66 0.17 34), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.75 0.09 195), transparent 70%)" }}
        />
        <Link href="/" className="relative flex items-center gap-2 font-semibold">
          <HomeLinkMark className="size-8" />
          HomeLink
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-[1.7rem] font-medium leading-snug tracking-[-0.01em]">
            «Jeg flyttet til Bergen uten å kjenne en sjel. Nå har jeg middag med tre andre
            spanjoler hver torsdag.»
          </p>
          <p className="mt-4 text-sm text-sidebar-muted">Lucía — flyttet fra Madrid til Bergen</p>
        </div>

        <div className="relative flex gap-6 text-sm text-sidebar-muted">
          <span>🌍 Global</span>
          <span>🇳🇴 Norge</span>
          <span>🏘️ Din by</span>
          <span>🫂 Ditt folk</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background p-6 sm:p-10">
        <Link href="/" className="mb-10 flex items-center gap-2 font-semibold lg:hidden">
          <HomeLinkMark className="size-7" />
          HomeLink
        </Link>
        {children}
      </div>
    </div>
  );
}
