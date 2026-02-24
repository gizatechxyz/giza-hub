/**
 * Partner Integration Example: Complete Workflow
 *
 * Demonstrates:
 * 1. Create a smart account for a user
 * 2. Get available protocols
 * 3. Activate the agent after user deposits
 * 4. Monitor performance and history
 * 5. Withdraw funds
 *
 * Prerequisites:
 * 1. Set up .env file with GIZA_API_KEY, GIZA_PARTNER_NAME, GIZA_API_URL
 * 2. Run: bun install
 * 3. Run: bun run example:agent
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { Giza, Chain } from "../src";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

async function main() {
  try {
    console.log("Giza Agent SDK - Partner Integration Example\n");

    const userWallet =
      "0x28a928CF7F96A944F2ed83432D3A03dDe2101420" as `0x${string}`;

    // Step 1: Initialize
    console.log("1. Initializing SDK...");
    const giza = new Giza({
      chain: Chain.BASE,
      timeout: 120000,
    });
    console.log(`   Chain: ${giza.getChain()}`);
    console.log(`   API URL: ${giza.getApiUrl()}\n`);

    // Step 2: Create smart account
    console.log("2. Creating smart account...");
    const agent = await giza.createAgent(userWallet);
    console.log(`   Smart Account: ${agent.wallet}\n`);

    // Step 3: Get protocols
    console.log("3. Fetching protocols for USDC...");
    const { protocols } = await giza.protocols(USDC_BASE);
    console.log(`   Available: ${protocols.join(", ")}\n`);

    // Step 4: User deposits
    console.log("4. User deposits to smart account...");
    console.log(`   Deposit to: ${agent.wallet}\n`);

    // Step 5: Activate
    console.log("5. Activating agent...");
    try {
      const activation = await agent.activate({
        owner: userWallet,
        token: USDC_BASE,
        protocols: ["aave", "compound"],
        txHash: "0x" + "0".repeat(64),
      });
      console.log(`   ${activation.message}\n`);
    } catch (error: any) {
      console.log(`   Activation failed: ${error.message}\n`);
    }

    // Step 6: Monitor performance
    console.log("6. Monitoring performance...");
    try {
      const portfolio = await agent.portfolio();
      console.log(`   Status: ${portfolio.status}`);
      console.log(`   Deposits: ${portfolio.deposits.length}`);

      const performance = await agent.performance();
      console.log(`   Data points: ${performance.performance.length}`);

      const aprData = await agent.apr();
      console.log(`   APR: ${aprData.apr}%\n`);
    } catch (error: any) {
      console.log(`   Not available: ${error.message}\n`);
    }

    // Step 7: Transaction history (auto-paginated)
    console.log("7. Fetching transactions...");
    try {
      const txs = await agent.transactions().first(10);
      console.log(`   Found ${txs.length} transactions`);
      for (const tx of txs) {
        console.log(`   - ${tx.action}: ${tx.amount} ${tx.token_type} (${tx.status})`);
      }
      console.log("");
    } catch (error: any) {
      console.log(`   No transactions yet: ${error.message}\n`);
    }

    // Step 8: Withdraw
    console.log("8. Initiating withdrawal...");
    try {
      await agent.withdraw();
      console.log("   Waiting for deactivation...");
      const final = await agent.waitForDeactivation({
        interval: 5000,
        timeout: 60000,
        onUpdate: (s) => console.log(`   Status: ${s}`),
      });
      console.log(`   Complete: ${final.status}\n`);
    } catch (error: any) {
      console.log(`   Skipped (demo): ${error.message}\n`);
    }

    console.log("-".repeat(60));
    console.log(`Smart Account: ${agent.wallet}`);
    console.log(`Origin Wallet: ${userWallet}`);
    console.log(`Chain: Base (${Chain.BASE})`);
    console.log("-".repeat(60));
  } catch (error: any) {
    console.error("\nError:", error.message);
    if (error.message.includes("API key")) {
      console.error("\nSet GIZA_API_KEY, GIZA_PARTNER_NAME, GIZA_API_URL in .env");
    }
    process.exit(1);
  }
}

main();
