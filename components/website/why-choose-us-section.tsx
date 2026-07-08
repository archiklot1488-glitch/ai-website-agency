type WhyChooseUsSectionProps = {
  items: string[];
};

export function WhyChooseUsSection({ items }: WhyChooseUsSectionProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            Why choose us
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            A simple, dependable customer experience
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              className="flex gap-4 rounded-lg border border-stone-200 bg-white p-5"
              key={item}
            >
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-secondary)] text-xs font-bold text-white">
                ✓
              </span>
              <p className="leading-7 text-stone-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
