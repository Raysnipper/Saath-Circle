import { createHash, randomBytes } from "crypto";

const INVITATION_TTL_DAYS = 14;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);
  return expiresAt;
}

export function isInvitationExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}
