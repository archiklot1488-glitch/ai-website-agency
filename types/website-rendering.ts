import type { Website } from "@/types/database";
import type { GeneratedWebsiteContent } from "@/types/generated-website";

export type WebsiteRenderMode = "preview" | "live";

export type RenderableWebsite = Omit<Website, "website_json"> & {
  website_json: GeneratedWebsiteContent;
};
