import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeneratedWebsiteRenderer } from "@/components/website/generated-website-renderer";
import { WebsiteErrorPage } from "@/components/website/website-error-page";
import { getLiveWebsiteBySlug } from "@/lib/websites";

type SitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: SitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getLiveWebsiteBySlug(slug);

  if (result.status !== "ok") {
    return {
      title: "Website unavailable",
    };
  }

  return {
    title: result.website.website_json.seo.title,
    description: result.website.website_json.seo.description,
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const { slug } = await params;
  const result = await getLiveWebsiteBySlug(slug);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "invalid") {
    return <WebsiteErrorPage message={result.message} />;
  }

  return <GeneratedWebsiteRenderer mode="live" website={result.website} />;
}
