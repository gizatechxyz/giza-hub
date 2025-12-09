/**
 * Partner Integration Example: Complete Workflow
 *
 * This example demonstrates the complete partner workflow:
 * 1. Create a smart account for a user
 * 2. Get available protocols
 * 3. Activate the agent after user deposits
 * 4. Monitor performance and history
 * 5. Withdraw funds
 *
 * Prerequisites:
 * 1. Set up .env file with GIZA_API_KEY and GIZA_API_URL
 * 2. Run: pnpm install
 * 3. Run this example: pnpm run example
 */

import "dotenv/config";
import { GizaAgent, Chain, AgentStatus } from "../src";

// Example token addresses (Base chain)
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function main() {
  try {
    console.log("🚀 Giza Agent SDK - Partner Integration Example\n");

    // Replace with actual user wallet address
    const userOriginWallet =
      "0xabcdef1234567890abcdef1234567890abcdef1234567890" as `0x${string}`;

    // =========================================================================
    // Step 1: Initialize the SDK
    // =========================================================================
    console.log("1️⃣  Initializing SDK...");
    const giza = new GizaAgent({
      chainId: Chain.BASE,
    });

    console.log(`   Chain: ${giza.getChainId()}`);
    console.log(`   Backend: ${giza.getBackendUrl()}`);
    console.log(`   Agent ID: ${giza.getAgentId()}\n`);

    // =========================================================================
    // Step 2: Create Smart Account for User
    // =========================================================================
    console.log("2️⃣  Creating smart account for user...");
    const account = await giza.agent.createSmartAccount({
      origin_wallet: userOriginWallet,
    });

    console.log("   ✅ Smart Account Created!");
    console.log(`   Smart Account: ${account.smartAccountAddress}`);
    console.log(`   Backend Wallet: ${account.backendWallet}`);
    console.log(`   Origin Wallet: ${account.origin_wallet}\n`);

    // =========================================================================
    // Step 3: Get Available Protocols
    // =========================================================================
    console.log("3️⃣  Fetching available protocols for USDC...");
    const { protocols } = await giza.agent.getProtocols(USDC_BASE);
    console.log(`   Available protocols: ${protocols.join(", ")}\n`);

    // =========================================================================
    // Step 4: User Deposits
    // =========================================================================
    console.log("4️⃣  User deposits to smart account...");
    console.log(`   📥 User should deposit to: ${account.smartAccountAddress}`);
    console.log(
      "   (In production, wait for deposit transaction to confirm)\n"
    );

    // =========================================================================
    // Step 5: Activate the Agent
    // =========================================================================
    console.log("5️⃣  Activating agent...");

    try {
      const activation = await giza.agent.activate({
        wallet: account.smartAccountAddress,
        origin_wallet: userOriginWallet,
        initial_token: USDC_BASE,
        selected_protocols: ["aave", "compound"],
      });
      console.log(`   ✅ ${activation.message}\n`);
    } catch (error: any) {
      console.log(`   ❌ Activation failed: ${error.message}\n`);
    }

    // =========================================================================
    // Step 6: Monitor Performance
    // =========================================================================
    console.log("6️⃣  Monitoring performance...");
    try {
      // Get portfolio/status
      const portfolio = await giza.agent.getPortfolio({
        wallet: account.smartAccountAddress,
      });
      console.log(`   Status: ${portfolio.status}`);
      console.log(`   Deposits: ${portfolio.deposits.length}`);
      console.log(
        `   Selected Protocols: ${portfolio.selected_protocols.join(", ")}`
      );

      // Get performance chart
      const performance = await giza.agent.getPerformance({
        wallet: account.smartAccountAddress,
      });
      console.log(
        `   Performance data points: ${performance.performance.length}`
      );

      // Get APR
      const apr = await giza.agent.getAPR({
        wallet: account.smartAccountAddress,
      });
      console.log(`   APR: ${apr.apr}%\n`);
    } catch (error: any) {
      console.log(`   ⚠️  Performance data not available: ${error.message}\n`);
    }

    // =========================================================================
    // Step 7: Get Transaction History
    // =========================================================================
    console.log("7️⃣  Fetching transaction history...");
    try {
      const history = await giza.agent.getTransactions({
        wallet: account.smartAccountAddress,
        page: 1,
        limit: 10,
      });
      console.log(`   Total transactions: ${history.pagination.total_items}`);
      history.transactions.forEach((tx, i) => {
        console.log(
          `   ${i + 1}. ${tx.action} - ${tx.amount} ${tx.token_type} (${
            tx.status
          })`
        );
      });
      console.log("");
    } catch (error: any) {
      console.log(`   ⚠️  No transactions yet: ${error.message}\n`);
    }

    // =========================================================================
    // Step 8: Withdraw (Full Withdrawal = Deactivation)
    // =========================================================================
    console.log("8️⃣  Initiating withdrawal...");

    try {
      const withdrawal = await giza.agent.withdraw({
        wallet: account.smartAccountAddress,
        transfer: true, // Transfer funds to origin wallet
      });
      console.log(`   ✅ ${withdrawal.message}`);

      // Poll for completion
      console.log("   ⏳ Waiting for withdrawal to complete...");
      const finalStatus = await giza.agent.pollWithdrawalStatus(
        account.smartAccountAddress,
        {
          interval: 5000,
          timeout: 60000,
          onUpdate: (status) => console.log(`      Status: ${status}`),
        }
      );
      console.log(
        `   ✅ Withdrawal complete! Final status: ${finalStatus.status}\n`
      );
    } catch (error: any) {
      console.log(`   ⚠️  Withdrawal skipped (demo mode): ${error.message}\n`);
    }

    // =========================================================================
    // Summary
    // =========================================================================
    console.log("─".repeat(60));
    console.log("📋 Summary");
    console.log("─".repeat(60));
    console.log(`Smart Account Address: ${account.smartAccountAddress}`);
    console.log(`Origin Wallet: ${userOriginWallet}`);
    console.log(`Chain: Base (${Chain.BASE})`);
    console.log("─".repeat(60));

    console.log("\n✅ Partner integration workflow complete!\n");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);

    if (error.message.includes("GIZA_API_KEY")) {
      console.error("\n💡 Make sure you have a .env file with:");
      console.error("   GIZA_API_KEY=your-partner-api-key");
      console.error("   GIZA_API_URL=giza-api-url");
    }

    process.exit(1);
  }
}

// Run the example
main();
