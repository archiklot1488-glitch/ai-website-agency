"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveWebsiteEditorAction } from "@/app/admin/websites/[id]/edit/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import type {
  GeneratedWebsiteContent,
  GeneratedWebsiteFaq,
  GeneratedWebsiteService,
  WebsiteQualityChecklist,
} from "@/types/generated-website";
import type { RenderableWebsite } from "@/types/website-rendering";

type WebsiteEditorFormProps = {
  website: RenderableWebsite;
};

type ChecklistKey = keyof WebsiteQualityChecklist;

const emptyService: GeneratedWebsiteService = {
  title: "",
  description: "",
};

const emptyFaq: GeneratedWebsiteFaq = {
  question: "",
  answer: "",
};

const defaultChecklist: WebsiteQualityChecklist = {
  heroHeadlineChecked: false,
  servicesChecked: false,
  contactDetailsChecked: false,
  ctaChecked: false,
  mobilePreviewChecked: false,
  readyToSend: false,
};

const inputClass =
  "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950";
const textareaClass =
  "mt-2 min-h-24 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save website"}
    </button>
  );
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextareaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <textarea
        className={textareaClass}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function checklistLabel(key: ChecklistKey) {
  const labels: Record<ChecklistKey, string> = {
    heroHeadlineChecked: "Hero headline checked",
    servicesChecked: "Services checked",
    contactDetailsChecked: "Contact details checked",
    ctaChecked: "CTA checked",
    mobilePreviewChecked: "Mobile preview checked",
    readyToSend: "Ready to send",
  };

  return labels[key];
}

export function WebsiteEditorForm({ website }: WebsiteEditorFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveWebsiteEditorAction,
    initialActionState,
  );
  const [content, setContent] = useState<GeneratedWebsiteContent>(() => ({
    ...website.website_json,
    admin: {
      checklist: {
        ...defaultChecklist,
        ...website.website_json.admin?.checklist,
      },
    },
  }));
  const previewHref = `/preview/${website.slug}?token=${website.preview_token}`;
  const liveHref = `/site/${website.slug}`;
  const serializedContent = useMemo(() => JSON.stringify(content), [content]);

  function updateSection<Key extends keyof GeneratedWebsiteContent>(
    section: Key,
    value: GeneratedWebsiteContent[Key],
  ) {
    setContent((current) => ({
      ...current,
      [section]: value,
    }));
  }

  function updateChecklist(key: ChecklistKey, value: boolean) {
    setContent((current) => ({
      ...current,
      admin: {
        checklist: {
          ...defaultChecklist,
          ...current.admin?.checklist,
          [key]: value,
        },
      },
    }));
  }

  function updateService(
    index: number,
    key: keyof GeneratedWebsiteService,
    value: string,
  ) {
    updateSection(
      "services",
      content.services.map((service, currentIndex) =>
        currentIndex === index
          ? {
              ...service,
              [key]: value,
            }
          : service,
      ),
    );
  }

  function updateFaq(index: number, key: keyof GeneratedWebsiteFaq, value: string) {
    updateSection(
      "faq",
      content.faq.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }

  function updateWhyChooseUs(index: number, value: string) {
    updateSection(
      "whyChooseUs",
      content.whyChooseUs.map((item, currentIndex) =>
        currentIndex === index ? value : item,
      ),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="website_id" type="hidden" value={website.id} />
      <input name="website_json" type="hidden" value={serializedContent} />

      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-stone-600">Status: {website.status}</p>
          <p className="mt-1 text-sm text-stone-600">Slug: {website.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            href="/admin"
          >
            Back to admin
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            href={previewHref}
            target="_blank"
          >
            Open preview
          </Link>
          {website.status === "live" ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              href={liveHref}
              target="_blank"
            >
              Open live site
            </Link>
          ) : null}
        </div>
      </div>

      {state.status !== "idle" ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Section title="Brand">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Business name"
            onChange={(businessName) =>
              updateSection("brand", { ...content.brand, businessName })
            }
            value={content.brand.businessName}
          />
          <Field
            label="Tone"
            onChange={(tone) => updateSection("brand", { ...content.brand, tone })}
            value={content.brand.tone}
          />
          <Field
            label="Primary color"
            onChange={(primaryColor) =>
              updateSection("brand", { ...content.brand, primaryColor })
            }
            value={content.brand.primaryColor}
          />
          <Field
            label="Secondary color"
            onChange={(secondaryColor) =>
              updateSection("brand", { ...content.brand, secondaryColor })
            }
            value={content.brand.secondaryColor}
          />
        </div>
        <TextareaField
          label="Tagline"
          onChange={(tagline) => updateSection("brand", { ...content.brand, tagline })}
          value={content.brand.tagline}
        />
      </Section>

      <Section title="Hero">
        <Field
          label="Headline"
          onChange={(headline) => updateSection("hero", { ...content.hero, headline })}
          value={content.hero.headline}
        />
        <TextareaField
          label="Subheadline"
          onChange={(subheadline) =>
            updateSection("hero", { ...content.hero, subheadline })
          }
          value={content.hero.subheadline}
        />
        <Field
          label="CTA text"
          onChange={(ctaText) => updateSection("hero", { ...content.hero, ctaText })}
          value={content.hero.ctaText}
        />
      </Section>

      <Section title="Services">
        <p className="text-sm text-stone-600">
          Recommended: 3-6 services. The editor will save other counts while you
          are still drafting.
        </p>
        {content.services.map((service, index) => (
          <div
            className="rounded-md border border-stone-200 bg-stone-50 p-4"
            key={index}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Title"
                onChange={(title) => updateService(index, "title", title)}
                value={service.title}
              />
              <div className="flex items-end">
                <button
                  className="h-10 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  onClick={() =>
                    updateSection(
                      "services",
                      content.services.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                  type="button"
                >
                  Remove service
                </button>
              </div>
            </div>
            <TextareaField
              label="Description"
              onChange={(description) =>
                updateService(index, "description", description)
              }
              value={service.description}
            />
          </div>
        ))}
        <button
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          onClick={() => updateSection("services", [...content.services, emptyService])}
          type="button"
        >
          Add service
        </button>
      </Section>

      <Section title="About">
        <Field
          label="Title"
          onChange={(title) => updateSection("about", { ...content.about, title })}
          value={content.about.title}
        />
        <TextareaField
          label="Paragraph"
          onChange={(paragraph) =>
            updateSection("about", { ...content.about, paragraph })
          }
          value={content.about.paragraph}
        />
      </Section>

      <Section title="Why Choose Us">
        {content.whyChooseUs.map((item, index) => (
          <div className="flex gap-2" key={index}>
            <input
              className={inputClass}
              onChange={(event) => updateWhyChooseUs(index, event.target.value)}
              value={item}
            />
            <button
              className="mt-2 h-10 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              onClick={() =>
                updateSection(
                  "whyChooseUs",
                  content.whyChooseUs.filter((_, currentIndex) => currentIndex !== index),
                )
              }
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          onClick={() => updateSection("whyChooseUs", [...content.whyChooseUs, ""])}
          type="button"
        >
          Add bullet
        </button>
      </Section>

      <Section title="FAQ">
        {content.faq.map((item, index) => (
          <div
            className="rounded-md border border-stone-200 bg-stone-50 p-4"
            key={index}
          >
            <Field
              label="Question"
              onChange={(question) => updateFaq(index, "question", question)}
              value={item.question}
            />
            <TextareaField
              label="Answer"
              onChange={(answer) => updateFaq(index, "answer", answer)}
              value={item.answer}
            />
            <button
              className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              onClick={() =>
                updateSection(
                  "faq",
                  content.faq.filter((_, currentIndex) => currentIndex !== index),
                )
              }
              type="button"
            >
              Remove FAQ
            </button>
          </div>
        ))}
        <button
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          onClick={() => updateSection("faq", [...content.faq, emptyFaq])}
          type="button"
        >
          Add FAQ
        </button>
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="CTA text"
            onChange={(ctaText) =>
              updateSection("contact", { ...content.contact, ctaText })
            }
            value={content.contact.ctaText}
          />
          <Field
            label="City"
            onChange={(city) => updateSection("contact", { ...content.contact, city })}
            value={content.contact.city}
          />
          <Field
            label="Phone"
            onChange={(phone) =>
              updateSection("contact", { ...content.contact, phone })
            }
            value={content.contact.phone}
          />
          <Field
            label="Email"
            onChange={(email) =>
              updateSection("contact", { ...content.contact, email })
            }
            value={content.contact.email}
          />
        </div>
      </Section>

      <Section title="SEO">
        <Field
          label="Title"
          onChange={(title) => updateSection("seo", { ...content.seo, title })}
          value={content.seo.title}
        />
        <TextareaField
          label="Description"
          onChange={(description) =>
            updateSection("seo", { ...content.seo, description })
          }
          value={content.seo.description}
        />
      </Section>

      <Section title="Quality checklist">
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(defaultChecklist) as ChecklistKey[]).map((key) => (
            <label className="flex items-center gap-3 text-sm text-stone-700" key={key}>
              <input
                checked={content.admin?.checklist?.[key] ?? false}
                className="h-4 w-4"
                onChange={(event) => updateChecklist(key, event.target.checked)}
                type="checkbox"
              />
              {checklistLabel(key)}
            </label>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-stone-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          Preview pages read from Supabase, so saved edits appear immediately.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
