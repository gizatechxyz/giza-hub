/**
 * Optimizer Example: Capital Allocation Optimization
 *
 * This example demonstrates how to use Giza's optimizer service to:
 * 1. Optimize capital allocation across lending protocols
 * 2. Get optimal target allocations with APR metrics
 * 3. Receive detailed action plans (deposits/withdrawals)
 * 4. Get execution-ready calldata for transactions
 *
 * Prerequisites:
 * 1. Set up .env file with GIZA_API_KEY, GIZA_PARTNER_NAME, and GIZA_API_URL
 * 2. Run: pnpm install
 * 3. Run this example: pnpm run example:optimizer
 */

import "dotenv/config";
import { GizaAgent, Chain, WalletConstraints } from "../src";

// Example token addresses (Base chain)
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

async function main() {
  try {
    console.log("🚀 Giza Agent SDK - Optimizer Example\n");

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
    // Step 2: Basic Optimization (No Constraints)
    // =========================================================================
    console.log("2️⃣  Running basic optimization (no constraints)...");
    console.log("   Current state:");
    console.log("   - Total capital: 200,000 USDC (6 decimals = 200000000000)");
    console.log("   - Current allocations:");
    console.log("     • Aave: 100,000 USDC (100000000000)");
    console.log("     • Compound: 100,000 USDC (100000000000)");
    console.log("   - Available protocols: aave, compound, moonwell, fluid\n");

    try {
      const basicResult = await giza.optimizer.optimize({
        chainId: Chain.BASE,
        total_capital: "200000000000", // 200,000 USDC (6 decimals)
        token_address: USDC_BASE,
        current_allocations: {
          aave: "100000000000", // 100,000 USDC
          compound: "100000000000", // 100,000 USDC
        },
        protocols: ["aave", "compound", "moonwell", "fluid"],
      });

      console.log("   ✅ Optimization completed!");
      console.log(`   📊 APR Improvement: ${basicResult.optimization_result.apr_improvement.toFixed(2)}%`);
      console.log(`   📈 Initial Weighted APR: ${basicResult.optimization_result.weighted_apr_initial.toFixed(2)}%`);
      console.log(`   📈 Final Weighted APR: ${basicResult.optimization_result.weighted_apr_final.toFixed(2)}%`);

      console.log("   🎯 Optimal Allocations:");
      basicResult.optimization_result.allocations.forEach((allocation) => {
        const amount = parseInt(allocation.allocation) / 1e6; // Convert to USDC
        console.log(
          `     • ${allocation.protocol}: ${amount.toFixed(2)} USDC (${allocation.apr.toFixed(2)}% APR)`
        );
      });
      console.log("");

      console.log("   📋 Action Plan:");
      basicResult.action_plan.forEach((action, i) => {
        const amount = parseInt(action.amount) / 1e6; // Convert to USDC
        console.log(
          `     ${i + 1}. ${action.action_type.toUpperCase()}: ${amount.toFixed(2)} USDC from/to ${action.protocol}`
        );
      });
      console.log("");

      console.log("   🔧 Calldata Transactions:");
      console.log(`     Total transactions: ${basicResult.calldata.length}`);
      basicResult.calldata.forEach((calldata, i) => {
        console.log(`     ${i + 1}. ${calldata.description}`);
        console.log(`        Contract: ${calldata.contract_address}`);
        console.log(`        Function: ${calldata.function_name}`);
      });
      console.log("");
    } catch (error: any) {
      console.log(`   ❌ Optimization failed: ${error.message}\n`);
    }

    // =========================================================================
    // Step 3: Optimization with Constraints
    // =========================================================================
    console.log("3️⃣  Running optimization with constraints...");
    console.log("   Constraints:");
    console.log("   - Minimum 2 protocols must be used");
    console.log("   - Exclude Compound protocol\n");

    try {
      const constrainedResult = await giza.optimizer.optimize({
        chainId: Chain.BASE,
        total_capital: "200000000000", // 200,000 USDC
        token_address: USDC_BASE,
        current_allocations: {
          aave: "100000000000", // 100,000 USDC
          compound: "100000000000", // 100,000 USDC
        },
        protocols: ["aave", "compound", "moonwell", "fluid"],
        constraints: [
          {
            kind: WalletConstraints.MIN_PROTOCOLS,
            params: { min_protocols: 2 },
          },
          {
            kind: WalletConstraints.EXCLUDE_PROTOCOL,
            params: { protocol: "compound" },
          },
        ],
      });

      console.log("   ✅ Constrained optimization completed!");
      console.log(`   📊 APR Improvement: ${constrainedResult.optimization_result.apr_improvement.toFixed(2)}%`);
      console.log(`   📈 Final Weighted APR: ${constrainedResult.optimization_result.weighted_apr_final.toFixed(2)}%\n`);

      console.log("   🎯 Optimal Allocations (with constraints):");
      constrainedResult.optimization_result.allocations.forEach((allocation) => {
        const amount = parseInt(allocation.allocation) / 1e6;
        console.log(
          `     • ${allocation.protocol}: ${amount.toFixed(2)} USDC (${allocation.apr.toFixed(2)}% APR)`
        );
      });
      console.log("");

      // Verify constraints were applied
      const protocolCount = constrainedResult.optimization_result.allocations.length;
      const hasCompound = constrainedResult.optimization_result.allocations.some(
        (a) => a.protocol === "compound"
      );

      console.log("   ✅ Constraint Verification:");
      console.log(`     • Minimum protocols (≥2): ${protocolCount >= 2 ? "✅" : "❌"} (${protocolCount} protocols)`);
      console.log(`     • Compound excluded: ${!hasCompound ? "✅" : "❌"}`);
      console.log("");
    } catch (error: any) {
      console.log(`   ❌ Constrained optimization failed: ${error.message}\n`);
    }


    // =========================================================================
    // Step 4: Optimization with Maximum Allocation Constraint
    // =========================================================================
    console.log("5️⃣  Running optimization with max allocation per protocol...");
    console.log("   Constraint: Maximum 60% allocation per protocol\n");

    try {
      const maxAllocationResult = await giza.optimizer.optimize({
        chainId: Chain.BASE,
        total_capital: "200000000000", // 200,000 USDC
        token_address: USDC_BASE,
        current_allocations: {
          aave: "140000000000", // 70% currently (140,000 USDC)
          compound: "60000000000", // 30% currently (60,000 USDC)
        },
        protocols: ["aave", "compound", "moonwell"],
        constraints: [
          {
            kind: WalletConstraints.MAX_ALLOCATION_AMOUNT_PER_PROTOCOL,
            params: {
              protocol: "aave",
              max_allocation: "120000000000", // Max 60% (120,000 USDC)
            },
          },
        ],
      });

      console.log("   ✅ Max allocation optimization completed!");
      console.log(`   📊 APR Improvement: ${maxAllocationResult.optimization_result.apr_improvement.toFixed(2)}%\n`);

      console.log("   🎯 Optimal Allocations (with max constraint):");
      const totalCapital = 200000000000; // 200,000 USDC
      maxAllocationResult.optimization_result.allocations.forEach((allocation) => {
        const amount = parseInt(allocation.allocation) / 1e6;
        const percentage = (parseInt(allocation.allocation) / totalCapital) * 100;
        console.log(
          `     • ${allocation.protocol}: ${amount.toFixed(2)} USDC (${percentage.toFixed(1)}%) - ${allocation.apr.toFixed(2)}% APR`
        );
      });

      // Verify max constraint
      const aaveAllocation = maxAllocationResult.optimization_result.allocations.find(
        (a) => a.protocol === "aave"
      );
      if (aaveAllocation) {
        const aaveAmount = parseInt(aaveAllocation.allocation);
        const isWithinLimit = aaveAmount <= 120000000000; // 120,000 USDC (60% of 200K)
        const aavePercentage = (aaveAmount / totalCapital) * 100;
        console.log(`\n   ✅ Aave max constraint (≤60%): ${isWithinLimit ? "✅" : "❌"} (${aavePercentage.toFixed(1)}%)`);
      }
      console.log("");
    } catch (error: any) {
      console.log(`   ⚠️  Max allocation optimization skipped: ${error.message}\n`);
    }

    // =========================================================================
    // Summary
    // =========================================================================
    console.log("─".repeat(60));
    console.log("📋 Summary");
    console.log("─".repeat(60));
    console.log("The optimizer service provides:");
    console.log("  • Optimal capital allocation across protocols");
    console.log("  • APR improvement calculations");
    console.log("  • Detailed action plans (deposits/withdrawals)");
    console.log("  • Execution-ready transaction calldata");
    console.log("  • Support for optimization constraints");
    console.log("  • Stateless operation (chainId as parameter)");
    console.log("─".repeat(60));

    console.log("\n✅ Optimizer example complete!\n");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);

    if (error.message.includes("GIZA_API_KEY") || error.message.includes("GIZA_PARTNER_NAME")) {
      console.error("\n💡 Make sure you have a .env file with:");
      console.error("   GIZA_API_KEY=your-partner-api-key");
      console.error("   GIZA_PARTNER_NAME=your-partner-name");
      console.error("   GIZA_API_URL=giza-api-url");
    }

    if (error.message.includes("ValidationError")) {
      console.error("\n💡 Validation error - check your input parameters:");
      console.error("   - total_capital must be a positive integer string");
      console.error("   - token_address must be a valid Ethereum address");
      console.error("   - current_allocations values must be non-negative integer strings");
      console.error("   - protocols array must not be empty");
      console.error("   - chainId must be a supported chain (BASE, ARBITRUM)");
    }

    process.exit(1);
  }
}

// Run the example
main();

