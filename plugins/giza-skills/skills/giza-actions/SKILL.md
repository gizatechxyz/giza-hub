---
name: giza-actions
description: Manage your Giza account — withdraw, claim rewards, deposit more, or change strategies
user-invocable: true
disable-model-invocation: false
---

# Account Actions

Handle financial operations on the user's Giza account. Every action follows the same pattern: explain what will happen, confirm with the user, execute, show the result, suggest next steps.

For all actions: if the user hasn't specified a network, default to Base (8453).

---

## Withdraw

**Intent signals**: "withdraw", "take out money", "cash out", "remove funds", "get my money back"

### Flow

1. Call **giza_get_portfolio** to show the current balance
2. Ask the user how much they want to withdraw (specific amount or "everything")
3. Explain clearly:
   - "Withdrawing $X,XXX.XX will move those funds back to your wallet. They will stop earning yield once withdrawn."
   - For full withdrawals: "This will withdraw your entire balance of $X,XXX.XX. Your account will remain open but inactive."
4. Ask for explicit confirmation: "Would you like to proceed? (yes/no)"
5. On "yes": Call **giza_withdraw** with the amount, then call **giza_confirm_operation**
6. Show the result: "Your withdrawal of $X,XXX.XX has been initiated. It may take a few minutes to arrive in your wallet."
7. Suggest: "I can check the status of your withdrawal in a few minutes. Want me to show your remaining balance?"

**If withdrawal fails**: Explain the error in plain language. Common issues:
- Insufficient balance: "You only have $X,XXX.XX available. Would you like to withdraw that amount instead?"
- Minimum not met: "The minimum withdrawal is $XX.XX."

---

## Claim Rewards

**Intent signals**: "claim rewards", "collect rewards", "get my rewards", "redeem"

### Flow

1. Call **giza_list_rewards** to check pending rewards
2. If no rewards pending: "You don't have any rewards to claim right now. Your rewards accumulate as your funds earn yield."
3. If rewards available, show the amount: "You have $XX.XX in rewards ready to claim. These will be sent to your wallet."
4. Ask for confirmation: "Would you like to claim your $XX.XX in rewards? (yes/no)"
5. On "yes": Call **giza_claim_rewards**, then call **giza_confirm_operation**
6. Show the result: "Your rewards of $XX.XX have been claimed and are being sent to your wallet."
7. Suggest: "Want to see your updated portfolio?"

---

## Top Up (Deposit More)

**Intent signals**: "deposit more", "add money", "top up", "send more"

### Flow

1. Call **giza_get_smart_account** to get the deposit address
2. Show the address: "To add more funds, send [token] on [network] to your deposit address: `[address]`"
3. Explain: "Once you've sent the transaction, share the transaction hash with me and I'll process it."
4. Wait for the user to provide a transaction hash
5. Call **giza_top_up** with the transaction hash
6. Show the result: "Your deposit has been received and your funds are now earning yield."
7. Suggest: "Want to see your updated portfolio?"

---

## Change Protocols

**Intent signals**: "change protocols", "switch strategy", "use different platforms", "update protocols"

### Flow

1. Call **giza_get_agent_protocols** to show current protocols
2. Call **giza_list_protocols** to show all available options
3. Present both: "You're currently using: [current protocols]. Here are all available options on [network]: [full list]"
4. Let the user choose new protocols
5. Explain the impact: "Changing protocols means your funds will be moved from [current] to [new]. This happens automatically and there are no fees for the move."
6. Call **giza_update_protocols** with the new selection
7. Show the result: "Your protocols have been updated. Your funds will be moved to the new allocation."
8. Suggest: "Want me to run an optimization check to make sure you're getting the best rate?"

---

## Deactivate Account

**Intent signals**: "stop", "deactivate", "pause", "turn off", "shut down"

### Flow

1. Call **giza_list_rewards** to check for pending rewards
2. If rewards pending: "Before deactivating, you have $XX.XX in unclaimed rewards. I'd recommend claiming those first. Want me to do that?"
3. Handle reward claiming if the user wants it (follow the Claim Rewards flow above)
4. Warn clearly: "Deactivating your account will stop it from earning yield. Your funds will remain in the account but won't be actively managed. You can reactivate later."
5. Ask for explicit confirmation: "Are you sure you want to deactivate your account? (yes/no)"
6. On "yes": Call **giza_deactivate_agent**, then call **giza_confirm_operation**
7. Show the result: "Your account has been deactivated. Your funds are still there but no longer earning yield."
8. Suggest: "You can reactivate anytime by asking me. Want to withdraw your funds instead?"
