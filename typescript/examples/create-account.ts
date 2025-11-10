/**
 * Simple example: Create a smart account
 * 
 * Prerequisites:
 * 1. Set up .env file with GIZA_API_KEY and GIZA_API_URL
 * 2. Run: pnpm install
 * 3. Run this example: pnpm run example
 */

import 'dotenv/config';
import { GizaAgent, Chain } from '../src';

async function main() {
  try {
    console.log('🚀 Giza Agent SDK - Create Smart Account Example\n');

    // Replace with your actual EOA address
    const userEOA = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

    // Initialize the SDK
    console.log('Initializing SDK...');
    const agent = new GizaAgent({
      chainId: Chain.BASE,
    });

    console.log(`Chain: ${agent.getChainId()}`);
    console.log(`Backend: ${agent.getBackendUrl()}`);
    console.log(`Agent ID: ${agent.getAgentId()}\n`);

    // Create smart account
    console.log(`Creating smart account for EOA: ${userEOA}...`);
    const account = await agent.smartAccount.create({
      eoa: userEOA,
    });

    // Display results
    console.log('\n✅ Smart Account Created Successfully!\n');
    console.log('Account Details:');
    console.log('─'.repeat(50));
    console.log(`Smart Account: ${account.smartAccountAddress}`);
    console.log(`Backend Wallet: ${account.backendWallet}`);
    console.log(`EOA:           ${account.eoa}`);
    console.log(`Chain:         ${account.chain}`);
    console.log('─'.repeat(50));

    console.log('\n💡 Next Steps:');
    console.log('1. Deposit funds to:', account.smartAccountAddress);
    console.log('2. The agent will automatically detect deposits');
    console.log('3. Agent will optimize positions across DeFi protocols\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('GIZA_API_KEY')) {
      console.error('\n💡 Make sure you have a .env file with:');
      console.error('   GIZA_API_KEY=your-key');
      console.error('   GIZA_API_URL=your-url');
    }
    
    process.exit(1);
  }
}

// Run the example
main();

