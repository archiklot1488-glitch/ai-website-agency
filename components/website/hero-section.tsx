import type { GeneratedWebsiteContent } from "@/types/generated-website";

type HeroSectionProps = {
  hero: GeneratedWebsiteContent["hero"];
  brand: GeneratedWebsiteContent["brand"];
};

export function HeroSection({ hero, brand }: HeroSectionProps) {
  return (
    <section className="bg-stone-50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            {brand.tone}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
            {hero.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
            {hero.subheadline}
          </p>
          <a
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--brand-primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90"
            href="#contact"
          >
            {hero.ctaText}
          </a>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="h-2 w-20 rounded-full bg-[var(--brand-secondary)]" />
          <p className="mt-6 text-2xl font-semibold text-stone-950">
            {brand.businessName}
          </p>
          <p className="mt-4 leading-7 text-stone-700">{brand.tagline}</p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-stone-700">
            <div className="rounded-md bg-stone-50 p-4">
              <span className="font-semibold text-stone-950">Local</span>
              <p className="mt-1">Built for nearby customers</p>
            </div>
            <div className="rounded-md bg-stone-50 p-4">
              <span className="font-semibold text-stone-950">Clear</span>
              <p className="mt-1">Simple next steps</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
