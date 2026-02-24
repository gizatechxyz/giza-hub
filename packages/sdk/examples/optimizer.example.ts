/**
 * Optimizer Example: Capital Allocation Optimization
 *
 * Demonstrates:
 * 1. Basic optimization (no constraints)
 * 2. Optimization with constraints
 * 3. Max allocation constraints
 *
 * Prerequisites:
 * 1. Set up .env file with GIZA_API_KEY, GIZA_PARTNER_NAME, GIZA_API_URL
 * 2. Run: bun install
 * 3. Run: bun run example:optimizer
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { Giza, Chain, WalletConstraints } from "../src";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

async function main() {
  try {
    console.log("Giza Agent SDK - Optimizer Example\n");

    // Step 1: Initialize
    console.log("1. Initializing SDK...");
    const giza = new Giza({ chain: Chain.BASE });
    console.log(`   Chain: ${giza.getChain()}\n`);

    // Step 2: Basic optimization
    console.log("2. Basic optimization (no constraints)...");
    try {
      const result = await giza.optimize({
        token: USDC_BASE,
        capital: "200000000000",
        currentAllocations: {
          aave: "100000000000",
          compound: "100000000000",
        },
        protocols: ["aave", "compound", "moonwell", "fluid"],
      });

      const opt = result.optimization_result;
      console.log(`   APR improvement: ${opt.apr_improvement.toFixed(2)}%`);
      console.log(`   Initial APR: ${opt.weighted_apr_initial.toFixed(2)}%`);
      console.log(`   Final APR: ${opt.weighted_apr_final.toFixed(2)}%`);

      for (const a of opt.allocations) {
        const amt = parseInt(a.allocation) / 1e6;
        console.log(`   - ${a.protocol}: ${amt.toFixed(2)} USDC (${a.apr.toFixed(2)}% APR)`);
      }

      console.log(`   Actions: ${result.action_plan.length}`);
      console.log(`   Calldata txs: ${result.calldata.length}\n`);
    } catch (error: any) {
      console.log(`   Failed: ${error.message}\n`);
    }

    // Step 3: Optimization with constraints
    console.log("3. Optimization with constraints...");
    try {
      const result = await giza.optimize({
        token: USDC_BASE,
        capital: "200000000000",
        currentAllocations: {
          aave: "100000000000",
          compound: "100000000000",
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

      const opt = result.optimization_result;
      console.log(`   APR improvement: ${opt.apr_improvement.toFixed(2)}%`);
      console.log(`   Protocols used: ${opt.allocations.length}`);
      const hasCompound = opt.allocations.some((a) => a.protocol === "compound");
      console.log(`   Compound excluded: ${!hasCompound}\n`);
    } catch (error: any) {
      console.log(`   Failed: ${error.message}\n`);
    }

    // Step 4: Max allocation constraint
    console.log("4. Max allocation per protocol...");
    try {
      const result = await giza.optimize({
        token: USDC_BASE,
        capital: "200000000000",
        currentAllocations: {
          aave: "140000000000",
          compound: "60000000000",
        },
        protocols: ["aave", "compound", "moonwell"],
        constraints: [
          {
            kind: WalletConstraints.MAX_ALLOCATION_AMOUNT_PER_PROTOCOL,
            params: { protocol: "aave", max_allocation: "120000000000" },
          },
        ],
      });

      const opt = result.optimization_result;
      console.log(`   APR improvement: ${opt.apr_improvement.toFixed(2)}%`);
      for (const a of opt.allocations) {
        const pct = (parseInt(a.allocation) / 200000000000) * 100;
        console.log(`   - ${a.protocol}: ${pct.toFixed(1)}%`);
      }
      console.log("");
    } catch (error: any) {
      console.log(`   Failed: ${error.message}\n`);
    }

    console.log("-".repeat(60));
    console.log("The optimizer provides:");
    console.log("  - Optimal capital allocation across protocols");
    console.log("  - APR improvement calculations");
    console.log("  - Action plans and execution-ready calldata");
    console.log("  - Constraint support");
    console.log("-".repeat(60));
  } catch (error: any) {
    console.error("\nError:", error.message);
    if (error.message.includes("API key") || error.message.includes("Partner")) {
      console.error("\nSet GIZA_API_KEY, GIZA_PARTNER_NAME, GIZA_API_URL in .env");
    }
    process.exit(1);
  }
}

main();
