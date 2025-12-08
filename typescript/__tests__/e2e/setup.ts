/**
 * E2E Test Setup
 * 
 * It runs before E2E tests to validate the environment
 * and ensure the backend services are running locally.
 */

import axios from 'axios';

interface E2EConfig {
  apiKey: string;
  partnerName: string;
  apiUrl: string;
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): E2EConfig {
  const apiKey = process.env.GIZA_API_KEY;
  const partnerName = process.env.GIZA_PARTNER_NAME;
  const apiUrl = process.env.GIZA_API_URL;

  if (!apiKey) {
    throw new Error(
      'E2E Tests require GIZA_API_KEY environment variable. ' +
        'Please set it to a valid API key for testing.'
    );
  }

  if (!partnerName) {
    throw new Error(
      'E2E Tests require GIZA_PARTNER_NAME environment variable. ' +
        'Please set it to the partner name associated with your API key.'
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
  console.log(`  - Partner: ${partnerName}`);
  console.log(`  - API Key: ${apiKey.substring(0, 10)}...`);

  return { apiKey, partnerName, apiUrl };
}

/**
 * Check if the backend API is healthy and accessible
 */
async function checkBackendHealth(config: E2EConfig): Promise<void> {
  try {
    // Try to hit a health check endpoint or root endpoint
    const response = await axios.get(config.apiUrl, {
      headers: {
        'X-Partner-API-Key': config.apiKey,
        'X-Partner-Name': config.partnerName,
      },
      timeout: 5000,
      validateStatus: () => true, // Accept any status
    });

    console.log(`✓ Backend API is accessible at ${config.apiUrl}`);
    console.log(`  - Status: ${response.status}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to backend at ${config.apiUrl}. ` +
            'Please ensure the arma-backend service is running locally. ' +
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
  console.log('Agent SDK E2E Test Suite');
  console.log('='.repeat(70));
  console.log('');
  console.log('Test Flow:');
  console.log('  01. Smart Account - Create and fund smart account');
  console.log('  02. Protocols - Discover available DeFi protocols');
  console.log('  03. Activation - Activate the agent');
  console.log('  04. Performance - Monitor performance and portfolio');
  console.log('  05. Withdrawal - Partial and full withdrawal');
  console.log('');
  console.log('Prerequisites:');
  console.log('  - agents-api running locally');
  console.log('  - arma-backend running locally');
  console.log('  - Partner API key created');
  console.log('  - Test EOA wallet funded with USDC on Base');
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
    await checkBackendHealth(config);

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

