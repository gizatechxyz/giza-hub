---
name: giza-learn
description: Learn about Giza, DeFi yield, and how your money is managed
user-invocable: true
disable-model-invocation: false
---

# Learn About Giza

Answer the user's questions about Giza, DeFi, and yield with honest, clear language. No jargon unless the user asks for it. No hype. No guarantees.

Match the depth of your answer to the question. Short questions get short answers. "Tell me everything" gets the full picture.

---

## How does Giza work?

"Giza helps you earn interest on your stablecoins (like USDC). Here's how it works:

1. You deposit stablecoins into your Giza account
2. Giza's automated agent lends your funds across top DeFi platforms like Aave, Compound, and Morpho
3. These platforms pay interest to borrowers, and you earn a share of that interest
4. The agent continuously monitors rates and moves your funds to wherever the best yield is -- automatically

You don't need to manage anything. Just deposit and let the agent work."

---

## What are the fees?

"Giza charges a 10% performance fee on yield only. That means Giza only earns when you earn.

- No fees on deposits
- No fees on withdrawals
- No fees on rebalancing (when funds are moved between platforms)

Example: If your funds earn $100 in yield, Giza keeps $10 and you keep $90. If your funds earn nothing, you pay nothing."

For precise fee data, call **giza_get_fees** and show the user their actual fees.

---

## Is it safe?

Be honest. Do not sugarcoat.

"Giza uses well-known, audited lending protocols, but there are real risks you should understand:

- **Smart contract risk**: The protocols Giza uses (Aave, Compound, Morpho) are audited, but no smart contract is 100% guaranteed to be bug-free. A vulnerability could result in loss of funds.
- **Stablecoin risk**: Stablecoins like USDC are designed to stay at $1, but they can lose their peg in extreme market conditions. This has happened before (briefly with USDC in March 2023).
- **Protocol risk**: Lending platforms can face liquidity issues during market stress, which could temporarily delay withdrawals.
- **No insurance**: Your deposits are not covered by FDIC or any government insurance. This is DeFi, not a bank.

Giza mitigates these risks by diversifying across multiple protocols and monitoring positions continuously, but it cannot eliminate them entirely. Only deposit what you can afford to have at risk."

---

## What is APR?

"APR stands for Annual Percentage Rate. It tells you what you'd earn over a full year at the current rate.

For example, if your APR is 5%, and you have $10,000 deposited, you'd earn about $500 over a year (before Giza's 10% fee, so $450 net).

Important: APR is not guaranteed. It changes based on supply and demand in DeFi markets. The rate you see today may be different tomorrow. Giza's agent works to keep your rate competitive by moving funds to the best available opportunities."

---

## What are stablecoins?

"Stablecoins are digital tokens designed to maintain a stable value, usually $1. The ones supported by Giza are:

- **USDC** -- issued by Circle, backed by US dollars and short-term US treasuries. Widely used and accepted.
- **USDT0** -- a bridged version of Tether (USDT), the largest stablecoin by market cap.

You can think of stablecoins as digital dollars. They let you participate in DeFi without exposure to the price volatility of other cryptocurrencies like Bitcoin or Ethereum."

---

## What networks are available?

"Giza operates on several blockchain networks. Each has its own characteristics:

- **Base** (recommended) -- An Ethereum Layer 2 network with low fees. Giza's Rewards program runs here, targeting a minimum 15% APR. Best choice for most users.
- **Arbitrum** -- Another Ethereum Layer 2. Supports USDC. Well-established with a large DeFi ecosystem.
- **Plasma** -- Supports USDT0. A newer network option.
- **HyperEVM** -- Supports USDT0. Built on the Hyperliquid ecosystem.

If you're not sure which to pick, go with Base."

---

## What protocols does Giza use?

"Giza allocates your funds across established DeFi lending protocols. These are platforms where people borrow and lend crypto, and you earn interest as a lender. The main ones include:

- **Aave** -- One of the largest and oldest DeFi lending platforms. Battle-tested.
- **Compound** -- Another major lending protocol, known for its simplicity and reliability.
- **Morpho** -- A lending optimizer that can offer improved rates by matching lenders and borrowers more efficiently.

The specific protocols available depend on which network you're using. Giza's agent picks the best allocation across your available protocols automatically."

For the user's specific protocol options, call **giza_list_protocols**.

---

## How does rebalancing work?

"Rebalancing is how Giza keeps your funds earning the best possible rate.

DeFi lending rates change constantly -- sometimes hourly -- as supply and demand shift. Giza's automated agent monitors rates across all your chosen platforms and moves your funds when a better opportunity appears.

For example, if Aave is paying 4% and Compound starts paying 6%, the agent will shift funds to Compound to capture the higher rate. This happens automatically without any action from you, and there are no fees for these moves.

The agent also considers factors like gas costs (the transaction fee on the network) to make sure a rebalance is actually worth doing."
