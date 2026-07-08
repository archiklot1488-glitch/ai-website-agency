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

export function scoreLeadCandidate(
  candidate: Pick<
    LeadCandidate,
    | "address"
    | "businessName"
    | "businessStatus"
    | "category"
    | "phone"
    | "rating"
    | "reviewCount"
    | "websiteUrl"
  >,
): LeadQualification {
  let score = 0;
  const signals: string[] = [];
  const hasWebsite = Boolean(candidate.websiteUrl);
  const hasPhone = Boolean(candidate.phone);
  const hasGoodRating =
    typeof candidate.rating === "number" && candidate.rating >= 4;
  const hasReviews =
    typeof candidate.reviewCount === "number" && candidate.reviewCount >= 10;
  const operational = isOperational(candidate.businessStatus);
  const likelyChain = isLikelyChain(candidate.businessName, candidate.category);

  if (!hasWebsite) {
    score += 50;
    signals.push("no website");
  }

  if (hasPhone) {
    score += 25;
    signals.push("phone available");
  }

  if (hasGoodRating) {
    score += 15;
    signals.push("good rating");
  }

  if (hasReviews) {
    score += 15;
    signals.push("enough reviews");
  }

  if (!operational) {
    score -= 30;
    signals.push("not operational");
  }

  if (likelyChain) {
    score -= 20;
    signals.push("likely chain");
  }

  if (!candidate.address) {
    score -= 10;
    signals.push("missing address");
  }

  const leadScore = clampScore(score);

  if (!operational) {
    return {
      leadScore,
      priority: "skip",
      qualification: "Skip: not operational",
      signals,
    };
  }

  if (leadScore >= 75 && !hasWebsite && hasPhone && (hasGoodRating || hasReviews)) {
    return {
      leadScore,
      priority: "hot",
      qualification: "Hot lead: no website, phone available, good reviews",
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
          : "Warm lead: missing website but needs more qualification",
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

  return {
    ...candidate,
    leadScore: qualification.leadScore,
    qualification: qualification.qualification,
  };
}
