import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeneratedWebsiteRenderer } from "@/components/website/generated-website-renderer";
import { WebsiteErrorPage } from "@/components/website/website-error-page";
import { getPreviewWebsiteBySlug } from "@/lib/websites";

type PreviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PreviewPage({
  params,
  searchParams,
}: PreviewPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const token = firstValue(query.token) ?? null;
  const result = await getPreviewWebsiteBySlug(slug, token);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "invalid") {
    return <WebsiteErrorPage message={result.message} />;
  }

  return <GeneratedWebsiteRenderer mode="preview" website={result.website} />;
}
