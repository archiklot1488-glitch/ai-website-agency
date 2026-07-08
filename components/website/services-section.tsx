import type { GeneratedWebsiteService } from "@/types/generated-website";

type ServicesSectionProps = {
  services: GeneratedWebsiteService[];
};

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section className="bg-white" id="services">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            Services
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            Practical support for local customers
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              key={service.title}
            >
              <div className="mb-5 h-10 w-10 rounded-md bg-[var(--brand-primary)]/10" />
              <h3 className="text-lg font-semibold text-stone-950">
                {service.title}
              </h3>
              <p className="mt-3 leading-7 text-stone-700">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
