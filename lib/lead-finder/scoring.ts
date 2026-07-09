import type { Json } from "@/types/database";
import type { LeadCandidate, LeadQualification } from "@/types/lead-finder";

const chainIndicators = [
  "7-eleven",
  "burger king",
  "chipotle",
  "costco",
  "cvs",
  "domino",
  "dunkin",
  "home depot",
  "kfc",
  "lowe",
  "mcdonald",
  "panera",
  "pizza hut",
  "starbucks",
  "subway",
  "taco bell",
  "target",
  "walgreens",
  "walmart",
];

const localServiceIndicators = [
  "ac repair",
  "auto repair",
  "cleaning",
  "contractor",
  "dentist",
  "electrician",
  "flooring",
  "garage door",
  "hair salon",
  "handyman",
  "heating",
  "hvac",
  "landscaping",
  "locksmith",
  "moving",
  "painter",
  "pest control",
  "plumber",
  "plumbing",
  "remodel",
  "restaurant",
  "roofer",
  "roofing",
  "spa",
  "tree service",
];

const weakWebsiteHosts = [
  "business.site",
  "facebook.com",
  "instagram.com",
  "linktr.ee",
  "sites.google.com",
  "wixsite.com",
  "wordpress.com",
];

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function isOperational(status: string | null | undefined) {
  if (!status) {
    return true;
  }

  return status.toUpperCase() === "OPERATIONAL";
}

export function isLikelyChain(name: string, category: string | null) {
  const haystack = `${name} ${category ?? ""}`.toLowerCase();
  return chainIndicators.some((indicator) => haystack.includes(indicator));
}

function isLikelyLocalService(category: string | null) {
  const haystack = (category ?? "").toLowerCase();
  return localServiceIndicators.some((indicator) => haystack.includes(indicator));
}

function isWeakWebsiteSignal(websiteUrl: string | null | undefined) {
  if (!websiteUrl) {
    return false;
  }

  try {
    const url = new URL(websiteUrl);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    return (
      url.protocol !== "https:" ||
      weakWebsiteHosts.some((indicator) => hostname.includes(indicator))
    );
  } catch {
    return true;
  }
}

export function getLeadSignalLabels(
  candidate: Pick<
    LeadCandidate,
    | "address"
    | "businessName"
    | "businessStatus"
    | "category"
    | "googleMapsUrl"
    | "phone"
    | "rating"
    | "reviewCount"
    | "websiteUrl"
  >,
) {
  const signals: string[] = [];
  const hasWebsite = Boolean(candidate.websiteUrl);

  if (hasWebsite) {
    signals.push("Already has website");

    if (isWeakWebsiteSignal(candidate.websiteUrl)) {
      signals.push("Website presence should be reviewed");
    }
  } else {
    signals.push("Missing website in Places data");
  }

  if (candidate.phone) {
    signals.push("Has phone number");
  }

  if (candidate.googleMapsUrl) {
    signals.push("Has Google Maps listing");
  }

  if (typeof candidate.reviewCount === "number" && candidate.reviewCount >= 25) {
    signals.push("Established review count");
  }

  if (typeof candidate.rating === "number" && candidate.rating >= 4) {
    signals.push("Decent rating");
  }

  if (isLikelyLocalService(candidate.category)) {
    signals.push("Service business niche");
  }

  if (!isOperational(candidate.businessStatus)) {
    signals.push("Business status is not operational");
  }

  if (isLikelyChain(candidate.businessName, candidate.category)) {
    signals.push("Likely chain or franchise");
  }

  if (!candidate.address) {
    signals.push("Address missing in provider data");
  }

  return signals;
}

export function scoreLeadCandidate(
  candidate: Pick<
    LeadCandidate,
    | "address"
    | "businessName"
    | "businessStatus"
    | "category"
    | "googleMapsUrl"
    | "phone"
    | "rating"
    | "reviewCount"
    | "websiteUrl"
  >,
): LeadQualification {
  let score = 0;
  const signals = getLeadSignalLabels(candidate);
  const hasWebsite = Boolean(candidate.websiteUrl);
  const weakWebsiteSignal = isWeakWebsiteSignal(candidate.websiteUrl);
  const hasPhone = Boolean(candidate.phone);
  const operational = isOperational(candidate.businessStatus);
  const likelyChain = isLikelyChain(candidate.businessName, candidate.category);
  const serviceBusiness = isLikelyLocalService(candidate.category);

  if (!hasWebsite) {
    score += 42;
  } else if (weakWebsiteSignal) {
    score += 14;
  }

  if (hasPhone) {
    score += 14;
  }

  if (candidate.googleMapsUrl) {
    score += 8;
  }

  if (typeof candidate.reviewCount === "number") {
    if (candidate.reviewCount >= 100) {
      score += 16;
    } else if (candidate.reviewCount >= 25) {
      score += 12;
    } else if (candidate.reviewCount >= 10) {
      score += 8;
    }
  }

  if (typeof candidate.rating === "number") {
    if (candidate.rating >= 4.2) {
      score += 8;
    } else if (candidate.rating >= 3.7) {
      score += 5;
    } else if (candidate.rating < 3.5) {
      score -= 5;
    }
  }

  if (serviceBusiness) {
    score += 12;
  }

  if (candidate.address) {
    score += 6;
  } else {
    score -= 8;
  }

  if (!operational) {
    score -= 50;
  }

  if (likelyChain) {
    score -= 25;
  }

  const cappedScore =
    hasWebsite && !weakWebsiteSignal ? Math.min(score, 70) : score;
  const leadScore = clampScore(cappedScore);

  if (!operational) {
    return {
      leadScore,
      priority: "skip",
      qualification: "Skip: not operational",
      signals,
    };
  }

  if (leadScore >= 75 && (!hasWebsite || weakWebsiteSignal) && hasPhone) {
    return {
      leadScore,
      priority: "hot",
      qualification:
        hasWebsite
          ? "Hot lead: website presence should be reviewed and local profile is strong"
          : "Hot lead: missing website in Places data with strong local profile",
      signals,
    };
  }

  if (leadScore >= 55) {
    return {
      leadScore,
      priority: "warm",
      qualification:
        hasWebsite
          ? "Warm lead: website exists but business has strong local presence"
          : "Warm lead: no website found in Places data but needs more qualification",
      signals,
    };
  }

  return {
    leadScore,
    priority: "low",
    qualification: "Low priority: missing phone or weak profile",
    signals,
  };
}

export function withLeadScore(
  candidate: Omit<LeadCandidate, "leadScore" | "qualification">,
): LeadCandidate {
  const qualification = scoreLeadCandidate(candidate);
  const leadFinderData = {
    leadFinder: {
      leadScore: qualification.leadScore,
      qualification: qualification.qualification,
      signals: qualification.signals,
    },
  } satisfies Json;
  const rawData =
    candidate.rawData &&
    typeof candidate.rawData === "object" &&
    !Array.isArray(candidate.rawData)
      ? {
          ...candidate.rawData,
          ...leadFinderData,
        }
      : leadFinderData;

  return {
    ...candidate,
    leadScore: qualification.leadScore,
    qualification: qualification.qualification,
    rawData,
    signals: qualification.signals,
  };
}
