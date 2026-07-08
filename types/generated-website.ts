export type GeneratedWebsiteContent = {
  brand: {
    businessName: string;
    tagline: string;
    tone: string;
    primaryColor: string;
    secondaryColor: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  services: GeneratedWebsiteService[];
  about: {
    title: string;
    paragraph: string;
  };
  whyChooseUs: string[];
  faq: GeneratedWebsiteFaq[];
  contact: {
    ctaText: string;
    phone: string;
    email: string;
    city: string;
  };
  seo: {
    title: string;
    description: string;
  };
};

export type GeneratedWebsiteService = {
  title: string;
  description: string;
};

export type GeneratedWebsiteFaq = {
  question: string;
  answer: string;
};
