import type { GeneratedWebsiteContent } from "@/types/generated-website";

type AboutSectionProps = {
  about: GeneratedWebsiteContent["about"];
};

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section className="bg-stone-50" id="about">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            About
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            {about.title}
          </h2>
        </div>
        <p className="text-lg leading-8 text-stone-700">{about.paragraph}</p>
      </div>
    </section>
  );
}
