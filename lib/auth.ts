export function isAllowedEmail(email: string): boolean {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase().trim();
  const normalized = email.toLowerCase().trim();

  // Always allow these specific emails regardless of domain
  const allowedEmails = [
    "shumorikawa2020@gmail.com",
    "syyboutdat24@gmail.com",
  ];
  if (allowedEmails.includes(normalized)) return true;

  if (!domain) return true;

  const suffix = "@" + domain.replace(/^@/, "");
  return normalized.endsWith(suffix);
}

export function getAllowedDomain(): string {
  return process.env.ALLOWED_EMAIL_DOMAIN?.trim() ?? "youruniversity.edu";
}
