---
name: giza-optimize
description: Check if your Giza account is getting the best possible yield and optimize if not
user-invocable: true
disable-model-invocation: false
---

# Yield Optimization

Help the user understand whether their funds are earning the best possible rate, and offer to improve their allocation if a better one exists.

## Fetching Current State

Call these tools in parallel:
- **giza_get_portfolio** -- current balance and allocation
- **giza_get_agent_protocols** -- which protocols the account is using
- **giza_get_apr** -- current earning rate

If the user hasn't specified a network, default to Base (8453).

## Running the Optimization

Call **giza_optimize** to simulate the best possible allocation given the user's balance and available protocols.

## Presenting Results

### If an improvement is found

Show the comparison clearly with real dollar impact:

"**Current allocation**:
- [Protocol A]: $X,XXX.XX at X.XX% APR
- [Protocol B]: $X,XXX.XX at X.XX% APR
- **Blended rate**: X.XX% APR

**Optimized allocation**:
- [Protocol C]: $X,XXX.XX at X.XX% APR
- [Protocol D]: $X,XXX.XX at X.XX% APR
- **Blended rate**: X.XX% APR

**Improvement**: +X.XX% APR, which means an extra $XX.XX per year on your $X,XXX.XX balance."

Then offer to apply: "Want me to update your protocols to the optimized allocation?"

If the user says yes, call **giza_update_protocols** with the recommended configuration, then confirm: "Your allocation has been updated. Your funds will be moved to the new configuration automatically."

### If already optimal

"Your funds are already in the best available allocation. You're earning X.XX% APR across [protocols]. No changes needed."

Suggest: "I'll keep an eye on rates. You can ask me to check again anytime. Want to see your full portfolio instead?"

### If no account found

"I don't see an active account on [network]. Would you like to set one up? I can walk you through it."
