import { config as loadDotEnv } from "dotenv";

const envFile = process.env.ENV_FILE ?? ".env";
loadDotEnv({ path: envFile });

const requiredVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const placeholderPatterns = [
  /^your-/i,
  /^generate-/i,
  /^postgresql:\/\/USER:PASSWORD@HOST/i,
  /^https:\/\/your-production-domain\.com$/i,
  /^your-email@example\.com$/i,
  /^your-email@gmail\.com$/i,
  /^\.{3}$/i,
];

function isPlaceholder(value) {
  return placeholderPatterns.some((pattern) => pattern.test(value));
}

function isLikelySecureSecret(value) {
  return value.length >= 32 && !/\s/.test(value);
}

const errors = [];
const warnings = [];

for (const name of requiredVars) {
  const value = process.env[name]?.trim();

  if (!value) {
    errors.push(`${name} is missing.`);
    continue;
  }

  if (isPlaceholder(value)) {
    errors.push(`${name} still uses a placeholder/example value.`);
  }
}

const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
if (nextAuthSecret && !isLikelySecureSecret(nextAuthSecret)) {
  warnings.push("NEXTAUTH_SECRET should be a long random string without spaces, ideally 32+ characters.");
}

const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
if (nextAuthUrl && !/^https?:\/\//i.test(nextAuthUrl)) {
  errors.push("NEXTAUTH_URL must include http:// or https://");
}
if (nextAuthUrl && /^http:\/\//i.test(nextAuthUrl) && !/localhost/i.test(nextAuthUrl)) {
  warnings.push("NEXTAUTH_URL is using http:// for a non-localhost URL.");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (databaseUrl && !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  warnings.push("DATABASE_URL does not look like a PostgreSQL connection string.");
}

const smtpPort = process.env.SMTP_PORT?.trim();
if (smtpPort && Number.isNaN(Number(smtpPort))) {
  errors.push("SMTP_PORT must be numeric.");
}

const smtpFrom = process.env.SMTP_FROM?.trim();
if (smtpFrom && !smtpFrom.includes("@")) {
  warnings.push("SMTP_FROM does not appear to contain an email address.");
}

if (errors.length > 0) {
  console.error(`Environment validation failed for ${envFile}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  for (const warning of warnings) {
    console.warn(`- Warning: ${warning}`);
  }
  process.exit(1);
}

console.log(`Environment validation passed for ${envFile}`);
for (const warning of warnings) {
  console.warn(`- Warning: ${warning}`);
}
