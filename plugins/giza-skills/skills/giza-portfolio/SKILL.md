---
name: giza-portfolio
description: Check your Giza portfolio — see your balance, yield, and how your funds are allocated
user-invocable: true
disable-model-invocation: false
---

# Portfolio Review

Show the user a clear, complete picture of their Giza account. Fetch data, format it cleanly, and offer relevant next steps.

## Fetching Data

Call these tools in parallel:
- **giza_get_portfolio** -- account balance and allocations
- **giza_get_apr** -- current earning rate
- **giza_list_rewards** -- pending and earned rewards

If the user has not specified a network, default to Base (8453). Mention this: "Here's your portfolio on Base."

## Multi-Chain Accounts

If the user might have accounts on multiple networks, check Base first. If the user asks about "all my accounts" or "everything", check all supported networks (Base, Arbitrum, Plasma, HyperEVM) and present a combined view.

For multi-chain summaries, show each network separately with its own totals, then a combined total at the end.

## Presenting the Portfolio

Format the data as a clean summary. Never dump raw JSON.

Structure:

"**Your Giza Portfolio on [Network]**

**Total Balance**: $X,XXX.XX
**Current Earning Rate**: X.XX% APR

**Allocation**:
- [Protocol A]: $X,XXX.XX (XX%)
- [Protocol B]: $X,XXX.XX (XX%)

**Rewards**:
- Total earned: $XX.XX
- Pending (claimable): $XX.XX"

Use the data presentation rules from the giza core skill: currency with commas and 2 decimals, percentages to 2 decimals.

## Proactive Suggestions

Based on the portfolio state, offer relevant follow-ups:

**Low APR** (below 5%): "Your current rate is X.XX%. Want me to check if there's a better allocation available?"

**Pending rewards**: "You have $XX.XX in unclaimed rewards. Want to claim them?"

**Idle or inactive funds**: "It looks like some of your funds aren't earning yield right now. Want me to help activate them?"

**Healthy portfolio** (good APR, active, no issues): "Everything looks good. Want me to run a quick optimization check, or would you like to see your transaction history?"

**No account found**: "I don't see an account on [network]. Would you like to set one up? I can walk you through it."
