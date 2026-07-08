import "server-only";

import { validateGeneratedWebsiteContent } from "@/lib/generated-website-validator";
import type { Business } from "@/types/database";
import type { GeneratedWebsiteContent } from "@/types/generated-website";

const fallbackServices = [
  "Personalized Service",
  "Expert Guidance",
  "Customer Support",
  "Local Solutions",
  "Quality Care",
  "Reliable Follow-Up",
];

const colorPalettes = [
  { primaryColor: "#0f766e", secondaryColor: "#f59e0b" },
  { primaryColor: "#1d4ed8", secondaryColor: "#16a34a" },
  { primaryColor: "#7c3aed", secondaryColor: "#ea580c" },
  { primaryColor: "#be123c", secondaryColor: "#0891b2" },
  { primaryColor: "#374151", secondaryColor: "#65a30d" },
];

function isMockAiEnabled() {
  return process.env.DEV_MOCK_AI?.trim().toLowerCase() === "true";
}

function hashValue(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function splitServices(services: string | null) {
  return (
    services
      ?.split(/[,;\n]/)
      .map((service) => service.trim())
      .filter(Boolean) ?? []
  );
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function businessTypeLabel(business: Business) {
  return business.business_type?.trim() || "local business";
}

function cityLabel(business: Business) {
  return business.city?.trim() || "your area";
}

function ctaText(business: Business) {
  return business.main_cta?.trim() || "Request a Quote";
}

function serviceDescriptions(
  services: string[],
  business: Business,
): GeneratedWebsiteContent["services"] {
  const serviceNames = [...services, ...fallbackServices].slice(0, 6);
  const selectedServices =
    serviceNames.length >= 3 ? serviceNames : fallbackServices;

  return selectedServices
    .slice(0, Math.max(3, Math.min(6, selectedServices.length)))
    .map((service) => ({
      title: titleCase(service),
      description: `${business.business_name} provides ${service.toLowerCase()} with clear communication, dependable scheduling, and attention to local customer needs.`,
    }));
}

export function shouldUseMockAi() {
  return isMockAiEnabled();
}

export function generateMockWebsiteContent(
  business: Business,
): GeneratedWebsiteContent {
  const hash = hashValue(`${business.id}:${business.business_name}`);
  const palette = colorPalettes[hash % colorPalettes.length];
  const typeLabel = businessTypeLabel(business);
  const city = cityLabel(business);
  const contactCta = ctaText(business);
  const services = serviceDescriptions(splitServices(business.services), business);
  const tagline =
    business.description?.trim() ||
    `Practical, friendly ${typeLabel} services for customers in ${city}.`;

  const content: GeneratedWebsiteContent = {
    brand: {
      businessName: business.business_name,
      tagline,
      tone: business.preferred_style?.trim() || "friendly and professional",
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
    },
    hero: {
      headline: `${titleCase(typeLabel)} Services in ${titleCase(city)}`,
      subheadline: `${business.business_name} helps local customers get dependable service, clear answers, and a smoother experience from the first conversation.`,
      ctaText: contactCta,
    },
    services,
    about: {
      title: `About ${business.business_name}`,
      paragraph: `${business.business_name} is a ${typeLabel} serving ${city}. The team focuses on useful guidance, responsive communication, and practical solutions that make it easier for customers to take the next step with confidence.`,
    },
    whyChooseUs: [
      "Local knowledge and customer-first communication",
      "Clear service details before work begins",
      "Professional follow-up from first contact to completion",
      "Flexible support built around real customer needs",
    ],
    faq: [
      {
        question: `How do I contact ${business.business_name}?`,
        answer: `Use the ${contactCta.toLowerCase()} option, call ${
          business.phone || "the listed phone number"
        }, or send an email to ${business.email || "the business email address"}.`,
      },
      {
        question: `What areas do you serve?`,
        answer: `${business.business_name} primarily serves customers in ${city}${
          business.country ? `, ${business.country}` : ""
        }.`,
      },
      {
        question: "What services are available?",
        answer: `Core services include ${services
          .slice(0, 3)
          .map((service) => service.title.toLowerCase())
          .join(", ")} and related support.`,
      },
      {
        question: "Can I request a custom recommendation?",
        answer:
          "Yes. Share a few details about what you need, and the team can recommend the best next step.",
      },
    ],
    contact: {
      ctaText: contactCta,
      phone: business.phone?.trim() || "Contact us for phone details",
      email: business.email?.trim() || "Contact us for email details",
      city,
    },
    seo: {
      title: `${business.business_name} | ${titleCase(typeLabel)} in ${titleCase(city)}`,
      description: `${business.business_name} offers professional ${typeLabel} services in ${city}. Contact the team for clear guidance and local support.`,
    },
  };

  const validation = validateGeneratedWebsiteContent(content);

  if (!validation.ok) {
    throw new Error(`Mock website JSON is invalid: ${validation.error}`);
  }

  return validation.data;
}
