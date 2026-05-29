# Arcadia Protocol

## A Better Way to Invest in Trading Talent

---

## Abstract

Arcadia lets investors earn from skilled traders without giving up control of their money. Traders prove themselves with their own capital first — only after passing a 30-day live test can they manage outside funds. When the trader wins, everyone shares the profits. When they lose, their own money absorbs the hit first, protecting investors.

No one else on Solana combines these three things: a trader proving ground, a built-in loss buffer, and a transparent profit-sharing system enforced entirely by code.

---

## 1. Why This Exists

### The Trust Problem

A talented trader with no track record has no way to attract capital. A trader with a great resume can still lose your money — and you won't know until it's too late.

Current solutions don't solve this. Copy-trading platforms replicate a trader's moves into your wallet but offer zero protection. Vault protocols pool investor money but require you to commit capital before the trader proves anything.

### The Cold Start Problem

Investors wait for a track record. Traders need capital to build one. Arcadia breaks this loop by having the team invest first — seeding the earliest vaults with their own capital. When a potential investor sees "Arcadia Capital has deposited $25,000 as a senior position in this vault," that visible commitment does what no feature can.

### The Incentive Problem

When someone else manages your money, their incentives don't always match yours. Without safeguards, a trader can swing for the fences — if they win, they collect a fee; if they lose, you absorb the damage.

---

## 2. How Arcadia Solves It

The system rests on a simple idea: **trust is earned, not assumed.** Every mechanism enforces this.

**Trader Launchpad.** Before managing anyone else's money, a trader must trade their own capital for at least 30 days and execute at least 30 trades. They must show positive returns and consistent activity. No exceptions. No shortcuts. This is not a simulation or training environment — the trader trades real capital with full freedom in execution style. They are evaluated purely on performance, risk behavior, and consistency.

**Graduation.** When the trader meets Launchpad requirements, the vault graduates. Only then can outside investors deposit funds. The trader has earned the right.

**Three Layers of Protection.** Every vault has three layers, like a moat with walls:

| Layer | Who Puts It In | Absorbs Losses | Gets Paid |
|-------|---------------|----------------|-----------|
| **Junior (first)** | The Trader | First — absorbs all losses until depleted | Performance fee only |
| **Mezzanine (second)** | Investors | Only after Junior is wiped | Larger share of profits |
| **Senior (last)** | Investors | Only after both lower layers are gone | Smaller but safer share |

When the vault earns money, the split works like this: the trader takes 20% as a performance fee, and 5% of profits stay in Junior to grow the buffer over time. The remaining 75% is distributed to investors — with Mezzanine getting 1.5 times as much per dollar as Senior, because they take more risk.

**Here's what that looks like in practice.** A vault with $70,000 from the trader, $200,000 from Senior investors, and $100,000 from Mezzanine investors ($370,000 total):

| If the vault earns | Trader gets | Senior gets | Mezzanine gets |
|---:|---:|---:|---:|
| **5%** ($18,500) | $3,700 | **3.9%** ($7,826) | **5.9%** ($5,874) |
| **10%** ($37,000) | $7,400 | **7.9%** ($15,789) | **11.8%** ($11,789) |
| **15%** ($55,500) | $11,100 | **11.8%** ($23,684) | **17.8%** ($17,684) |
| **20%** ($74,000) | $14,800 | **15.8%** ($31,579) | **23.7%** ($23,579) |
| **30%** ($111,000) | $22,200 | **23.7%** ($47,368) | **35.5%** ($35,368) |

These returns come entirely from the trader's actual performance. If the vault doesn't earn a profit in a given period, no one gets paid. There are no fixed rates, no guaranteed yields, no promises — just a share of whatever the trader actually produces.

**The High Water Mark.** The trader only earns fees on profits above the vault's previous peak. If the vault drops and then recovers, the trader collects nothing on the recovery — they only get paid for new gains. This prevents a common exploit where traders collect fees repeatedly on the same performance.

---

## 3. How the Vault Works

### The Lifecycle

Every vault moves through distinct stages:

**Trader Launchpad (30 days).** The trader trades their own money. No outside deposits allowed. This is the proving ground — the trader must show positive returns and at least 30 trades. It is not a training environment: the trader has full freedom in execution style and is evaluated purely on results.

**Active.** After graduation, Senior investors can deposit. The vault operates with two layers (Junior + Senior). Trading continues.

**Mature (90 days after Active).** After three months of proven operation — with Junior health at 60% or above, no prior freeze, and Senior capital at least 3 times Junior capital sustained for 10 trading days — the Mezzanine layer opens. Top performers unlock this faster: if Junior stays above 80% for 30 straight days, Mezzanine opens immediately.

**Cooldown.** If the vault takes heavy losses too quickly, trading pauses temporarily. Deposits stop, but withdrawals remain open. This gives the trader time to reassess without pressure:

| If the vault drops by | Trading pauses for |
|---|---|
| Over 5% in a single trade | 2 hours |
| Over 10% in 24 hours | 24 hours |
| Over 20% in 7 days | 72 hours |

**Frozen.** If the trader's Junior capital hits zero after outside money has entered, the vault freezes permanently. Trading stops forever. Any remaining capital is returned — Senior first, then Mezzanine, then whatever is left for Junior. A freeze stays on the trader's permanent record.

**Closed.** The trader can voluntarily close the vault at any time by selling all positions and returning capital to investors. Clean exit, no reputation penalty.

### How Losses Are Absorbed

Losses always flow in strict order — never shared proportionally across layers:

1. **Junior** absorbs first — the trader's own money
2. **If Junior is depleted, Mezzanine** absorbs next
3. **If both are depleted, Senior** absorbs last

When the vault distributes remaining capital (during a freeze or close), the order reverses: Senior gets made whole first, then Mezzanine, then Junior.

---

## 4. Safety Mechanisms

**Position limits** prevent a trader from betting too much on one trade. The maximum single-trade size depends on how healthy the Junior layer is:

| Junior Health | Maximum Single Position |
|---|---|
| 100% or above | 2 times Junior capital |
| 60–99% | 1.5 times Junior capital |
| 20–59% | 0.75 times Junior capital |
| Below 20% | Trading locked + emergency exit opens |

A single reckless trade shouldn't wipe a trader before cooldowns react. At full health with a $50K Junior stake, the max position is $100K — the position must lose 50% to wipe Junior, which is an extreme tail event on spot swaps.

The Senior and Mezzanine layers don't affect these limits — the trader can't use investor money to increase their bet size.

**Vault Guard.** Every swap passes through an on-chain guard before execution. The guard checks four things in sequence: position sizing (does this trade respect the current limit?), liquidity reserves (will at least 20% stay in stablecoin after the swap?), oracle freshness (is the price feed recent enough?), and cooldown status (is the vault paused?). If any check fails, the trade is rejected automatically. The guard enforces the rules mechanically — no human judgment, no exceptions.

**Junior grows over time.** 5% of every profitable period's gains stays in Junior, building the trader's buffer. A consistently profitable trader sees their survival margin widen year over year. A trader who barely breaks even stays thin and vulnerable — exactly the right signal.

**Liquid reserve.** At least 20% of the vault must stay as stablecoin at all times. This prevents the vault from being fully invested in assets that can't be sold quickly when investors want to withdraw.

**Emergency exit.** If Junior health drops below 20%, Senior investors can withdraw instantly with no waiting period and no fees. This only applies to Senior — Mezzanine investors have a 7-day lockup that stays in place unless the vault freezes entirely.

**Position privacy.** Traders execute through private ephemeral rollups — trade details never touch the public chain, only the guard's approval result does. Investors get cryptographic proof that every rule was followed without ever seeing what the trader bought, sold, or held. This protects proprietary strategies from being copied by competitors and prevents front-running by observers. When a vault closes or freezes, full trade history becomes public — accountability after the fact, privacy during the game.

---

## 5. How Arcadia Compares to Other Options

### For Traders: Arcadia vs Trading Alone

A good trader can earn more through Arcadia than trading alone — because they collect fees on the full vault, not just their own capital. A trader who puts up $50,000 as Junior on a $500,000 vault earns fees on ten times their personal stake:

| Vault Return | Trading Solo ($50K) | Via Arcadia | Difference |
|---:|---:|---:|---:|
| -20% (bad year) | **Lose $10,000** | **Lose $50,000** | Worse |
| +10% (average year) | **Earn $5,000** | **Earn $8,500** | +70% better |
| +20% (strong year) | **Earn $10,000** | **Earn $17,000** | +70% better |
| +35% (exceptional year) | **Earn $17,500** | **Earn $29,750** | +70% better |

The catch: in a bad year, Arcadia punishes losses much harder. A 10% vault loss wipes the entire Junior stake — because Junior absorbs losses first. A solo trader losing 10% only loses $5,000.

Arcadia is a leverage tool for profitable traders and a loss amplifier for unprofitable ones. That asymmetry is intentional — it ensures only skilled traders attract investor capital.

### For Investors: Arcadia vs Passive Yields

Compare putting $300,000 into Arcadia's Senior layer vs parking it in a Solana lending protocol earning 4.27% (the current market average):

| If the vault earns | Passive 4.27% | Arcadia Senior | Better choice |
|---:|---:|---:|---:|
| -20% (bear year) | +$12,810 | **$0 (principal protected)** | Passive wins |
| +3% (flat year) | +$12,810 | **+$6,900 (2.3%)** | Passive wins |
| +10% (average) | +$12,810 | **+$22,860 (7.6%)** | Arcadia |
| +20% (strong) | +$12,810 | **+$45,714 (15.2%)** | Arcadia |
| +35% (exceptional) | +$12,810 | **+$80,000 (26.7%)** | Arcadia |

The break-even point: when the vault earns above roughly 5.5% annually, Arcadia Senior beats passive yields. Below that, you're better off with the safe option. But in a bear year, Senior principal stays untouched while Junior and Mezzanine absorb the losses — that protection has value even when returns are zero.

### Simulating a Full Year

For a $500,000 vault ($50K Junior, $300K Senior, $150K Mezzanine) in an average year (10% return), here's what each month looks like:

| Who | Monthly Earnings | Annual Total |
|---|---|---|
| **Senior investors** | $1,905 | **$22,860 (7.6%)** |
| **Mezzanine investors** | $1,429 | **$17,148 (11.4%)** |
| **Trader (after protocol cut)** | $708 | **$8,496 (17% effective)** |
| **Protocol** | $333 | **$3,996** |

In a bear year where the vault loses 20%, the waterfall in action by month 7:

| Month | Trader's Junior | Senior | Mezzanine |
|---|---|---|---|
| Jan | $41,667 | $300,000 | $150,000 |
| Mar | $25,414 | $300,000 | $150,000 |
| May | $9,699 | $300,000 | $150,000 |
| Jul | **$0 (wiped)** | **$300,000** | **$144,504 (-3.7%)** |

Senior capital never moves. Mezzanine only takes a small hit after Junior runs dry. The trader loses everything — exactly as designed.

---

## 6. Arcadia's Fees

The protocol earns revenue through three streams, all transparent:

| Fee | Rate | When It's Charged |
|---|---|---|
| Management fee | 0.5% of total vault per year | Accrued continuously, collected monthly |
| Trader performance fee | 20% of profits above previous peak | Only when the vault sets a new record |
| Protocol performance cut | 15% of the trader's fee | Same as above — taken from the trader's side |
| Withdrawal fee | 0.1% | Only when the vault is healthy. Waived during emergencies |

At $50 million in total deposits, the protocol generates approximately $570,000 per year — enough to fund development, security audits, and infrastructure. At $100 million (about 2% of Solana's current total), annual revenue reaches $1.14 million.

The withdrawal fee is intentionally low and is waived entirely when the vault is in trouble — the protocol doesn't tax investors for using the safety mechanisms designed to protect them.

---

## 7. Competitive Landscape

A search of over 5,400 Solana projects confirms: no one has built what Arcadia is building.

**Whale Finance** connects traders to investors but has no proving ground and no loss protection. **Defunds Finance** offers copy-trading vaults without any capital safeguards. **Kormos** uses a similar layered structure but for passive yield — not active trading. **Trenches.top** tracks trader reputation but doesn't let anyone manage capital.

| Feature | Whale Finance | Defunds | Kormos | Trenches.top | **Arcadia** |
|---|:---:|:---:|:---:|:---:|:---:|
| Managed vaults | Yes | Yes | Yes | No | **Yes** |
| Trader proving period | No | No | No | No | **Yes** |
| Three-layer protection | No | No | Yes (2 layers) | No | **Yes (3 layers)** |
| Sequential loss absorption | No | No | Yes | No | **Yes** |
| Fee only on new profits | No | No | No | No | **Yes** |
| Trader track record | Partial | No | No | Yes | **Yes** |
| Positions hidden during trading | No | No | No | No | **Yes** |
| Position size limits | No | No | No | No | **Yes** |
| Loss cooldown | No | No | No | No | **Yes** |
| Emergency instant exit | No | No | No | No | **Yes** |

---

## 8. Growth

Arcadia doesn't need a marketing budget. Every trader on the platform has a direct financial reason to promote their vault — more capital under management means higher fee income. Their on-chain track record (returns, risk metrics, vault health) becomes their proof of skill. Investors find them by the numbers, not by hype.

Better traders attract more investors. More capital attracts better traders. The protocol grows because everyone is aligned, not because anyone is spending on ads.

---

## Conclusion

Arcadia is built on a simple premise: **trust should be earned, not assumed.**

A trader proves they can trade before anyone gives them money. Their own capital takes losses first if things go wrong. They only get paid when they set new records. Investors see real, verifiable performance before committing. And when a vault fails, the record is permanent — because accountability matters.

The three-layer structure, the proving ground, the sequential loss absorption, the high-water mark for fees, the position limits, the cooldown system — each is simple on its own. Together, they form a system that doesn't exist anywhere else on Solana.

That's the moat. That's Arcadia.
