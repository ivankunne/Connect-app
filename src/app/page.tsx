import Link from "next/link";
import { CalendarDays, Globe2, MessagesSquare, Sparkles, Users } from "lucide-react";
import { HomeLinkMark } from "@/components/brand";
import { HeroVisual } from "@/components/landing/hero-visual";
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

const STEPS = [
  { icon: Users, title: "Fortell hvem du er", text: "Hjemland, byen du bor i, og hva du er interessert i." },
  { icon: Sparkles, title: "Bli plassert automatisk", text: "Vi kobler deg til de riktige fellesskapene – ingen tomme rom." },
  { icon: MessagesSquare, title: "Bli med i praten", text: "Chat, still spørsmål, finn arrangementer og møt folk." },
];

const FEATURES = [
  { icon: Globe2, title: "Fellesskap som passer deg", text: "Fra «Global» til «Spanjoler i Bergen» – fra bredt til hjemlig." },
  { icon: MessagesSquare, title: "Sanntidschat", text: "Kanaler for bolig, jobb, mat, kjøp & salg og mer." },
  { icon: CalendarDays, title: "Ekte møter", text: "Lag arrangementer, si at du kommer, og møt folk i virkeligheten." },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HomeLinkMark className="size-8" />
            HomeLink
          </Link>
          <div className="flex items-center gap-2">
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
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> For deg som bor i et nytt land
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Finn ditt folk i et nytt land
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              HomeLink kobler deg til folk fra hjemlandet ditt og naboer i byen du bor i. Bli med i
              samtaler, still spørsmål og møt folk – helt automatisk.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Kom i gang – det er gratis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Jeg har allerede en konto</Link>
              </Button>
            </div>
          </div>
          <HeroVisual />
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Slik fungerer det
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
                  <span className="absolute right-5 top-5 text-3xl font-bold text-muted-foreground/25">
                    {i + 1}
                  </span>
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 py-14 text-center text-sidebar-foreground">
            <div
              className="pointer-events-none absolute -left-16 -top-16 size-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, oklch(0.66 0.17 34), transparent 70%)" }}
            />
            <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">Du er ikke alene her</h2>
            <p className="relative mx-auto mt-3 max-w-md text-sidebar-muted">
              Tusenvis av folk bygger et nytt hjem, akkurat som deg. Bli med i dag.
            </p>
            <Button asChild size="lg" className="relative mt-6">
              <Link href="/signup">Opprett konto</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <HomeLinkMark className="size-6" />
            <span>HomeLink</span>
          </div>
          <p>Bygget for folk som bor langt hjemmefra.</p>
        </div>
      </footer>
    </div>
  );
}
