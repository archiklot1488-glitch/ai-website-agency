import type { GeneratedWebsiteContent } from "@/types/generated-website";

const fallbackColors = {
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
};

function isSafeColor(value: string) {
  const trimmed = value.trim();

  return (
    /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(trimmed) ||
    /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(trimmed) ||
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i.test(
      trimmed,
    ) ||
    /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/i.test(trimmed) ||
    /^[a-z]+$/i.test(trimmed)
  );
}

function safeColor(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return isSafeColor(value) ? value.trim() : fallback;
}

export function getSafeBrandColors(content: GeneratedWebsiteContent) {
  return {
    primaryColor: safeColor(
      content.brand.primaryColor,
      fallbackColors.primaryColor,
    ),
    secondaryColor: safeColor(
      content.brand.secondaryColor,
      fallbackColors.secondaryColor,
    ),
  };
}
