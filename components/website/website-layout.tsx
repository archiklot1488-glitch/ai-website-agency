import type { CSSProperties, ReactNode } from "react";
import { getSafeBrandColors } from "@/lib/website/brand-colors";
import type { GeneratedWebsiteContent } from "@/types/generated-website";
import type { WebsiteRenderMode } from "@/types/website-rendering";
import { PreviewBanner } from "@/components/website/preview-banner";

type WebsiteLayoutProps = {
  content: GeneratedWebsiteContent;
  mode: WebsiteRenderMode;
  children: ReactNode;
};

type BrandStyle = CSSProperties & {
  "--brand-primary": string;
  "--brand-secondary": string;
};

export function WebsiteLayout({ content, mode, children }: WebsiteLayoutProps) {
  const colors = getSafeBrandColors(content);
  const style: BrandStyle = {
    "--brand-primary": colors.primaryColor,
    "--brand-secondary": colors.secondaryColor,
  };

  return (
    <div className="min-h-screen bg-white text-stone-950" style={style}>
      {mode === "preview" ? <PreviewBanner /> : null}
      <header className="border-b border-stone-200 bg-white/95">
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-stone-950">
              {content.brand.businessName}
            </p>
            <p className="mt-1 text-sm text-stone-600">{content.brand.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-medium text-stone-700">
            <a className="hover:text-[var(--brand-primary)]" href="#services">
              Services
            </a>
            <a className="hover:text-[var(--brand-primary)]" href="#about">
              About
            </a>
            <a className="hover:text-[var(--brand-primary)]" href="#faq">
              FAQ
            </a>
            <a className="hover:text-[var(--brand-primary)]" href="#contact">
              Contact
            </a>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
