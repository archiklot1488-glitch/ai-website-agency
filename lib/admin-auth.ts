import "server-only";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "ai_website_agency_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function sessionDigest(password: string) {
  return createHash("sha256")
    .update(`ai-website-agency-admin:${password}`)
    .digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword());
}

export async function verifyAdminPassword(password: string) {
  const configuredPassword = getAdminPassword();

  if (!configuredPassword) {
    return false;
  }

  return safeCompare(password, configuredPassword);
}

export async function setAdminSession() {
  const configuredPassword = getAdminPassword();

  if (!configuredPassword) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, sessionDigest(configuredPassword), {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const configuredPassword = getAdminPassword();

  if (!configuredPassword) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return false;
  }

  return safeCompare(cookieValue, sessionDigest(configuredPassword));
}

export async function requireAdmin() {
  return isAdminAuthenticated();
}
