/**
 * Checks if an email is from the allowed university domain.
 * Used to restrict sign-up and login to university emails only.
 */
export function isAllowedEmail(email: string): boolean {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase().trim();
  if (!domain) {
    // If not set, allow all (useful for local dev); in production you should set this
    return true;
  }
  const normalized = email.toLowerCase().trim();
  const suffix = "@" + domain.replace(/^@/, "");
  return normalized.endsWith(suffix);
}

export function getAllowedDomain(): string {
  return process.env.ALLOWED_EMAIL_DOMAIN?.trim() ?? "youruniversity.edu";
}
