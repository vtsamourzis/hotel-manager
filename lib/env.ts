const REQUIRED_VARS = [
  "HA_URL",
  "HA_TOKEN",
  "AUTH_SECRET",
] as const;

const OPTIONAL_VARS = [
  "AUTH_TRUST_HOST",
  "DB_PATH",
  "PROPERTY_NAME",
  "NEXT_PUBLIC_PROPERTY_NAME",
  "PORT",
] as const;

let validated = false;

export function validateEnv(): void {
  if (validated) return;

  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[hotel-manager] Missing required environment variables:\n` +
      missing.map((v) => `  - ${v}`).join("\n") +
      `\n\nEnsure .env file exists at ${process.cwd()}/.env ` +
      `or set variables in the environment.\n` +
      `See .env.example for reference.`
    );
  }

  validated = true;
}

// Re-export for type safety (unused at runtime, useful for documentation)
export type RequiredVar = typeof REQUIRED_VARS[number];
export type OptionalVar = typeof OPTIONAL_VARS[number];
