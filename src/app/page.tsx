import Link from "next/link";
import { ArrowRight, CalendarDays, MessagesSquare, Users2 } from "lucide-react";
import { HomeLinkMark } from "@/components/brand";
import { AppPreview } from "@/components/landing/app-preview";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "HomeLink",
      url: siteUrl,
      description:
        "HomeLink kobler folk som bor utenfor hjemlandet sitt til fellesskap basert på hjemland, nåværende land og by.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: "HomeLink",
      inLanguage: "nb-NO",
      publisher: { "@id": `${siteUrl}#organization` },
    },
  ],
};

const PEOPLE = [
  { i: "LM", c: "oklch(0.7 0.13 34)" },
  { i: "TK", c: "oklch(0.7 0.13 195)" },
  { i: "AM", c: "oklch(0.7 0.13 285)" },
  { i: "JD", c: "oklch(0.7 0.13 145)" },
  { i: "SR", c: "oklch(0.7 0.13 60)" },
];

const COMMUNITY_CHIPS = [
  { flag: "🇪🇸", name: "Spanish in Bergen", n: 128 },
  { flag: "🇵🇱", name: "Polish in Norway", n: 340 },
  { flag: "🇳🇴", name: "Norway - Oslo", n: 512 },
  { flag: "🇩🇪", name: "German in Norway", n: 210 },
  { flag: "🌍", name: "Global", n: 1840 },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HomeLinkMark className="size-8" />
            <span className="text-lg">HomeLink</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Logg inn</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Bli med</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Ny i Norge? Du er ikke den eneste.
              </span>

              <h1 className="mt-5 font-display text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-6xl">
                Et nytt land
                <br />
                trenger ikke å
                <br />
                <span className="relative whitespace-nowrap text-primary">
                  føles fremmed.
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-primary/35"
                    viewBox="0 0 300 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d="M2 8c60-6 236-6 296 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
                HomeLink finner folk fra hjemlandet ditt og naboer i byen du flyttet
                til — og setter deg rett inn i praten. Ingen tomme rom, ingen
                oppsett. Bare ditt folk.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link href="/signup">
                    Finn ditt folk <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="h-12 px-4 text-base">
                  <Link href="/login">Jeg har en konto</Link>
                </Button>
              </div>

              <div className="mt-9 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {PEOPLE.map((p) => (
                    <span
                      key={p.i}
                      className="flex size-8 items-center justify-center rounded-full text-[0.6rem] font-bold text-white ring-2 ring-background"
                      style={{ backgroundColor: p.c }}
                    >
                      {p.i}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">3 200+</span> mennesker fra
                  70 land har allerede funnet sitt
                </p>
              </div>
            </div>

            <AppPreview />
          </div>
        </section>

        {/* Community proof strip */}
        <section className="border-y border-border bg-sidebar text-sidebar-foreground">
          <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="shrink-0 text-sm text-sidebar-muted">Levende fellesskap akkurat nå</p>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_CHIPS.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-sm"
                  >
                    <span>{c.flag}</span>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sidebar-muted">{c.n.toLocaleString("nb-NO")}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works — editorial */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
              Fra fremmed til hjemme, på minutter
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ingen kompliserte innstillinger. Fortell oss hvor du er fra og hvor du bor —
              resten skjer av seg selv.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-3">
            {[
              { n: "01", t: "Fortell hvem du er", d: "Hjemland, byen du bor i nå, og hva du liker. Tar under ett minutt." },
              { n: "02", t: "Vi finner ditt folk", d: "Du blir automatisk med i «Spanjoler i Bergen», «Norge» og mer — aldri et tomt rom." },
              { n: "03", t: "Bli med i praten", d: "Still spørsmål, del tips, lag et treff. Møt folk som forstår hvordan det er." },
            ].map((s, i) => (
              <div key={s.n} className="relative">
                <div className="font-display text-5xl font-semibold text-primary/25">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                {i < 2 && (
                  <div className="absolute right-0 top-6 hidden h-px w-8 translate-x-4 bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bento showcase — show, don't tell */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Big: chat */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 md:col-span-2">
              <MessagesSquare className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em]">
                Samtaler som faktisk hjelper
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Egne kanaler for bolig, jobb, mat, kjøp & salg. Spør om alt fra fastlege
                til hvor du får tak i ordentlig kaffe — på ditt språk.
              </p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {["Bolig", "Jobb", "Mat & tips", "Kjøp & salg", "Spørsmål"].map((t) => (
                  <span key={t} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="rounded-3xl border border-border bg-card p-7">
              <CalendarDays className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em]">
                Ekte møter
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Lag et treff, si at du kommer, og møt folk ansikt til ansikt.
              </p>
            </div>

            {/* Diaspora */}
            <div className="rounded-3xl border border-border bg-card p-7">
              <Users2 className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em]">
                Ditt folk, nær deg
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Fra hele verden til nabolaget ditt — fellesskap for akkurat din kombinasjon.
              </p>
            </div>

            {/* Pull-quote testimonial */}
            <div className="relative overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground md:col-span-2">
              <div
                className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, white, transparent 70%)" }}
              />
              <p className="relative font-display text-2xl font-medium leading-snug tracking-[-0.01em] sm:text-[1.7rem]">
                «Jeg flyttet til Bergen uten å kjenne en sjel. Nå har jeg middag med tre
                andre spanjoler hver torsdag.»
              </p>
              <p className="relative mt-4 text-sm text-primary-foreground/80">
                Lucía — flyttet fra Madrid til Bergen
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface px-6 py-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-70" />
            <div className="relative">
              <h2 className="mx-auto max-w-lg font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
                Noen venter allerede på å møte deg
              </h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Det er gratis, og du er inne i et fellesskap før kaffen er ferdig.
              </p>
              <Button asChild size="lg" className="mt-7 h-12 px-7 text-base">
                <Link href="/signup">
                  Kom i gang <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <HomeLinkMark className="size-6" />
            <span className="font-medium text-foreground">HomeLink</span>
          </div>
          <p>Bygget for folk som bor langt hjemmefra.</p>
        </div>
      </footer>
    </div>
  );
}
