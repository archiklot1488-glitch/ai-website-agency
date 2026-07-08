import type {
  GeneratedWebsiteContent,
  GeneratedWebsiteFaq,
  GeneratedWebsiteService,
} from "@/types/generated-website";

type ValidationResult =
  | {
      ok: true;
      data: GeneratedWebsiteContent;
    }
  | {
      ok: false;
      error: string;
    };

type StringValidation =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  path: string,
): StringValidation {
  const value = record[key];

  if (!isNonEmptyString(value)) {
    return {
      ok: false,
      error: `${path}.${key} is required.`,
    };
  }

  return {
    ok: true,
    value: value.trim(),
  };
}

function validateStringArray(
  value: unknown,
  path: string,
  minLength: number,
  maxLength: number,
) {
  if (!Array.isArray(value)) {
    return `${path} must be an array.`;
  }

  if (value.length < minLength || value.length > maxLength) {
    return `${path} must include ${minLength}-${maxLength} items.`;
  }

  for (const [index, item] of value.entries()) {
    if (!isNonEmptyString(item)) {
      return `${path}[${index}] must be a non-empty string.`;
    }
  }

  return null;
}

function validateServices(value: unknown) {
  if (!Array.isArray(value)) {
    return "services must be an array.";
  }

  if (value.length < 3 || value.length > 6) {
    return "services must include 3-6 services.";
  }

  for (const [index, service] of value.entries()) {
    if (!isRecord(service)) {
      return `services[${index}] must be an object.`;
    }

    const title = requiredString(service, "title", `services[${index}]`);
    const description = requiredString(
      service,
      "description",
      `services[${index}]`,
    );

    if (!title.ok) {
      return title.error;
    }

    if (!description.ok) {
      return description.error;
    }
  }

  return null;
}

function validateFaq(value: unknown) {
  if (!Array.isArray(value)) {
    return "faq must be an array.";
  }

  if (value.length < 4 || value.length > 6) {
    return "faq must include 4-6 questions.";
  }

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      return `faq[${index}] must be an object.`;
    }

    const question = requiredString(item, "question", `faq[${index}]`);
    const answer = requiredString(item, "answer", `faq[${index}]`);

    if (!question.ok) {
      return question.error;
    }

    if (!answer.ok) {
      return answer.error;
    }
  }

  return null;
}

function validateObjectStrings(
  value: unknown,
  path: string,
  keys: string[],
) {
  if (!isRecord(value)) {
    return `${path} must be an object.`;
  }

  for (const key of keys) {
    const result = requiredString(value, key, path);

    if (!result.ok) {
      return result.error;
    }
  }

  return null;
}

export function validateGeneratedWebsiteContent(
  value: unknown,
): ValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: "Generated website content must be an object.",
    };
  }

  const validations = [
    validateObjectStrings(value.brand, "brand", [
      "businessName",
      "tagline",
      "tone",
      "primaryColor",
      "secondaryColor",
    ]),
    validateObjectStrings(value.hero, "hero", [
      "headline",
      "subheadline",
      "ctaText",
    ]),
    validateServices(value.services),
    validateObjectStrings(value.about, "about", ["title", "paragraph"]),
    validateStringArray(value.whyChooseUs, "whyChooseUs", 3, 5),
    validateFaq(value.faq),
    validateObjectStrings(value.contact, "contact", [
      "ctaText",
      "phone",
      "email",
      "city",
    ]),
    validateObjectStrings(value.seo, "seo", ["title", "description"]),
  ];

  const error = validations.find((message) => message !== null);

  if (error) {
    return {
      ok: false,
      error,
    };
  }

  const content = value as GeneratedWebsiteContent;

  return {
    ok: true,
    data: {
      brand: {
        businessName: content.brand.businessName.trim(),
        tagline: content.brand.tagline.trim(),
        tone: content.brand.tone.trim(),
        primaryColor: content.brand.primaryColor.trim(),
        secondaryColor: content.brand.secondaryColor.trim(),
      },
      hero: {
        headline: content.hero.headline.trim(),
        subheadline: content.hero.subheadline.trim(),
        ctaText: content.hero.ctaText.trim(),
      },
      services: content.services.map((service): GeneratedWebsiteService => ({
        title: service.title.trim(),
        description: service.description.trim(),
      })),
      about: {
        title: content.about.title.trim(),
        paragraph: content.about.paragraph.trim(),
      },
      whyChooseUs: content.whyChooseUs.map((item) => item.trim()),
      faq: content.faq.map((item): GeneratedWebsiteFaq => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      })),
      contact: {
        ctaText: content.contact.ctaText.trim(),
        phone: content.contact.phone.trim(),
        email: content.contact.email.trim(),
        city: content.contact.city.trim(),
      },
      seo: {
        title: content.seo.title.trim(),
        description: content.seo.description.trim(),
      },
    },
  };
}
