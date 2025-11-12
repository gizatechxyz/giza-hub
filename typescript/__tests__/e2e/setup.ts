/**
 * E2E Test Setup
 * 
 * It runs before E2E tests to validate the environment
 * and ensure the backend services are running locally.
 */

import axios from 'axios';

interface E2EConfig {
  apiKey: string;
  apiUrl: string;
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): E2EConfig {
  const apiKey = process.env.GIZA_API_KEY;
  const apiUrl = process.env.GIZA_API_URL;

  if (!apiKey) {
    throw new Error(
      'E2E Tests require GIZA_API_KEY environment variable. ' +
        'Please set it to a valid API key for testing.'
    );
  }

  if (!apiUrl) {
    throw new Error(
      'E2E Tests require GIZA_API_URL environment variable. ' +
        'Please set it to point to your local or test backend URL.'
    );
  }

  console.log('✓ Environment variables validated');
  console.log(`  - API URL: ${apiUrl}`);
  console.log(`  - API Key: ${apiKey.substring(0, 10)}...`);

  return { apiKey, apiUrl };
}

/**
 * Check if the backend API is healthy and accessible
 */
async function checkBackendHealth(apiUrl: string, apiKey: string): Promise<void> {
  try {
    // Try to hit a health check endpoint or root endpoint
    const response = await axios.get(apiUrl, {
      headers: {
        'X-Partner-API-Key': apiKey,
      },
      timeout: 5000,
      validateStatus: () => true, // Accept any status
    });

    console.log(`✓ Backend API is accessible at ${apiUrl}`);
    console.log(`  - Status: ${response.status}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to backend at ${apiUrl}. ` +
            'Please ensure the agents-api service is running locally. ' +
            'See __tests__/e2e/README.md for setup instructions.'
        );
      }
      throw new Error(
        `Backend health check failed: ${error.message}. ` +
          'Please check that the service is running and accessible.'
      );
    }
    throw error;
  }
}

/**
 * Display test configuration information
 */
function displayTestInfo(): void {
  console.log('\n' + '='.repeat(70));
  console.log('E2E Test Environment Setup');
  console.log('='.repeat(70));
  console.log('');
  console.log('These tests will connect to real backend services:');
  console.log('  - agents-api: Handles smart account creation');
  console.log('  - arma-backend: Provides backend functionality');
  console.log('');
  console.log('Make sure both services are running locally before running E2E tests.');
  console.log('See __tests__/e2e/README.md for detailed setup instructions.');
  console.log('');
  console.log('='.repeat(70));
  console.log('');
}

/**
 * Global setup function called before all E2E tests
 */
export default async function globalSetup(): Promise<void> {
  displayTestInfo();

  try {
    const config = validateEnvironment();
    await checkBackendHealth(config.apiUrl, config.apiKey);

    console.log('');
    console.log('✓ E2E environment is ready');
    console.log('');
    console.log('='.repeat(70));
    console.log('');
  } catch (error) {
    console.error('');
    console.error('✗ E2E Setup Failed:');
    console.error('');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${String(error)}`);
    }
    console.error('');
    console.error('='.repeat(70));
    console.error('');
    
    // Exit with error to prevent tests from running
    throw error;
  }
}

// Run setup immediately when loaded by Jest
beforeAll(async () => {
  await globalSetup();
}, 30000);

