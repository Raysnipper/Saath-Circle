const missingEnvKeys = new Set<string>();

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getOptionalEnv(name: string) {
  return readEnv(name);
}

export function getRequiredEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function warnMissingEnv(name: string, context: string) {
  if (missingEnvKeys.has(name)) {
    return;
  }

  missingEnvKeys.add(name);
  console.warn(`[${context}] Missing environment variable: ${name}`);
}
