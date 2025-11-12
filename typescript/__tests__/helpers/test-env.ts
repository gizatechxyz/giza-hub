/**
 * Test environment setup utilities
 */

export interface TestEnvConfig {
  GIZA_API_KEY: string;
  GIZA_API_URL: string;
}

const ORIGINAL_ENV = { ...process.env };

/**
 * Set up test environment variables
 */
export function setupTestEnv(config: Partial<TestEnvConfig> = {}): void {
  process.env.GIZA_API_KEY = config.GIZA_API_KEY || 'test-api-key-12345';
  process.env.GIZA_API_URL = config.GIZA_API_URL || 'https://api.test.giza.example';
}

/**
 * Clear specific environment variables
 */
export function clearTestEnv(): void {
  delete process.env.GIZA_API_KEY;
  delete process.env.GIZA_API_URL;
}

/**
 * Restore original environment
 */
export function restoreEnv(): void {
  process.env = { ...ORIGINAL_ENV };
}

/**
 * Run a test with specific environment variables
 */
export async function withEnv<T>(
  env: Partial<TestEnvConfig>,
  fn: () => T | Promise<T>
): Promise<T> {
  const originalEnv = { ...process.env };
  
  try {
    setupTestEnv(env);
    return await fn();
  } finally {
    process.env = originalEnv;
  }
}

