import type { GeneratedWebsiteFaq } from "@/types/generated-website";

type FAQSectionProps = {
  faq: GeneratedWebsiteFaq[];
};

export function FAQSection({ faq }: FAQSectionProps) {
  return (
    <section className="bg-stone-50" id="faq">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            Common questions
          </h2>
        </div>
        <div className="mt-10 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {faq.map((item) => (
            <details className="group p-5" key={item.question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-stone-950">
                {item.question}
                <span className="text-xl text-[var(--brand-primary)] group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 leading-7 text-stone-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
