---
name: giza-get-started
description: Get started with Giza — set up your account and start earning yield on your stablecoins
user-invocable: true
disable-model-invocation: false
---

# Get Started with Giza

Walk the user through setting up their Giza account step by step. Be patient, encouraging, and clear at every stage. This is their first experience with Giza -- make it a good one.

## Step 1: Welcome

Briefly introduce what Giza does:

"Giza helps you earn yield on your stablecoins automatically. You deposit tokens like USDC, and Giza's agent moves your funds across top DeFi lending platforms to get the best rates -- all without you having to do anything."

Keep it to 2-3 sentences. Do not explain the full technical architecture.

## Step 2: Login

Call **giza_login** to get a login URL.

Show the URL to the user: "First, let's get you logged in. Please open this link in your browser: [URL]"

Wait for the user to confirm they have logged in before proceeding. Do not proceed until they confirm.

## Step 3: Choose a Network

Call **giza_list_chains** to show available networks.

Present them in a simple list with a recommendation:

"Which network would you like to use? Here are the options:

- **Base** (recommended) -- Has the Giza Rewards program with a 15% minimum APR target. Best for most users.
- **Arbitrum** -- Supports USDC
- **Plasma** -- Supports USDT0
- **HyperEVM** -- Supports USDT0

I'd recommend Base if you're just getting started."

Wait for the user to choose before proceeding.

## Step 4: Show Supported Tokens

Once the user picks a network, call **giza_list_tokens** for that network.

Show which tokens are supported: "On [network], you can deposit [token list]. Which token would you like to use?"

## Step 5: Check for Existing Account

Call **giza_get_agent** to check if the user already has an account on the chosen network.

**If they already have an account**: Skip to showing their portfolio. "You already have an account on [network]. Let me show you how it's doing." Then call giza_get_portfolio and present the summary.

**If no account exists**: Continue to Step 6.

## Step 6: Create Account

Call **giza_create_agent** with the chosen network and token.

Once created, show the deposit address clearly:

"Your account is ready. Here's your deposit address:

`[address]`

This is where you'll send your [token] to start earning yield."

## Step 7: Guide the Deposit

Explain how to deposit:

"To fund your account, send [token] on [network] to the address above using your wallet (MetaMask, Coinbase Wallet, etc.).

Once you've sent the transaction, share the transaction hash with me so I can track it."

Wait for the user to provide a transaction hash or confirm the deposit.

**If the user doesn't have tokens**: "You'll need some [token] to get started. You can buy it on an exchange like Coinbase or Binance, then send it to your deposit address on [network]."

## Step 8: Choose Protocols

Call **giza_list_protocols** for the chosen network to show available lending platforms.

"Now let's pick where your funds should earn yield. Here are the available lending platforms on [network]:

[List protocols with brief descriptions]

You can choose one or more. If you're unsure, I'd recommend starting with [top protocol] -- it's well-established and has competitive rates."

Wait for the user to choose.

## Step 9: Activate

Call **giza_activate_agent** with the deposit transaction hash and chosen protocols.

"Activating your account..."

If activation succeeds, continue to Step 10.

**If activation fails**: "Something went wrong while activating your account. Let me check what happened." Investigate the error, explain it clearly, and suggest a fix. Common issues:
- Deposit hasn't confirmed yet: "Your deposit is still confirming on the network. Let's wait a moment and try again."
- Insufficient deposit: "The deposit amount may be too low. Let me check the minimum."

## Step 10: Confirmation

Call **giza_get_portfolio** to show the initial state.

"You're all set. Your account is active and earning yield on [network].

Here's your starting position:
[Portfolio summary]

Your funds will be automatically moved to the best rates across your chosen platforms. You don't need to do anything -- just check in whenever you want to see how things are going.

A few things you can do next:
- Ask me 'How's my portfolio?' anytime to check your balance and earnings
- Ask 'Am I getting the best rate?' to run an optimization check
- Ask 'What are my rewards?' to see what you've earned"
