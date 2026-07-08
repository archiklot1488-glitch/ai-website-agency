import { AboutSection } from "@/components/website/about-section";
import { ContactSection } from "@/components/website/contact-section";
import { FAQSection } from "@/components/website/faq-section";
import { HeroSection } from "@/components/website/hero-section";
import { ServicesSection } from "@/components/website/services-section";
import { WebsiteLayout } from "@/components/website/website-layout";
import { WhyChooseUsSection } from "@/components/website/why-choose-us-section";
import type {
  RenderableWebsite,
  WebsiteRenderMode,
} from "@/types/website-rendering";

type GeneratedWebsiteRendererProps = {
  mode: WebsiteRenderMode;
  website: RenderableWebsite;
};

export function GeneratedWebsiteRenderer({
  mode,
  website,
}: GeneratedWebsiteRendererProps) {
  const content = website.website_json;

  return (
    <WebsiteLayout content={content} mode={mode}>
      <main>
        <HeroSection brand={content.brand} hero={content.hero} />
        <ServicesSection services={content.services} />
        <AboutSection about={content.about} />
        <WhyChooseUsSection items={content.whyChooseUs} />
        <FAQSection faq={content.faq} />
        <ContactSection
          contact={content.contact}
          mode={mode}
          websiteId={website.id}
        />
      </main>
      <footer className="border-t border-stone-200 bg-stone-950 px-6 py-8 text-sm text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>{content.brand.businessName}</p>
          <p>{content.seo.description}</p>
        </div>
      </footer>
    </WebsiteLayout>
  );
}
