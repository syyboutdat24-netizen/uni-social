export function isAllowedEmail(email: string): boolean {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase().trim();
  const normalized = email.toLowerCase().trim();

  // Always allow this specific email regardless of domain
  if (normalized === "shumorikawa2020@gmail.com") return true;

  if (!domain) return true;

  const suffix = "@" + domain.replace(/^@/, "");
  return normalized.endsWith(suffix);
}

export function getAllowedDomain(): string {
  return process.env.ALLOWED_EMAIL_DOMAIN?.trim() ?? "youruniversity.edu";
}