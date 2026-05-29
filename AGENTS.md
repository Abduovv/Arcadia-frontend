# Arcadia — Agent Guide

## Project structure

```
Arcadia_program/          # On-chain program (Pinocchio, no Anchor)
  program/src/
    instructions/         # 11 instruction handlers
    states/               # Zero-copy bytemuck account structs
  kiln-tests/             # LiteSVM integration tests
app/                      # Frontend (Vite + React + Tailwind v3 + shadcn/ui)
  src/pages/              # Route pages (React Router v6)
  src/hooks/              # Data fetching (TanStack Query)
  src/lib/                # Wallet, Solana helpers, mockData, formatting
server-rs/                # Axum indexer + Helius webhook handler
clients/                  # Generated TypeScript SDK (Shank + Codama)
docs/                     # Context docs, ADRs, state machines, flows
```

## Commands

```sh
# Frontend dev (port 5000)
bash dev.sh

# Or directly:
cd app && npx vite --config vite.config.ts

# Frontend test
cd app && npx vitest run

# Single test
cd app && npx vitest run src/pages/VaultDetail.test.tsx

# Frontend lint
cd app && npx eslint .

# Program build (SBF)
cd Arcadia_program/program && cargo build-sbf

# Program tests (LiteSVM)
cd Arcadia_program/kiln-tests && cargo test

# Indexer
cd server-rs && cargo run

# Codegen: Shank IDL → Codama TypeScript SDK
pnpm codegen
# = pnpm codegen:shank && pnpm codegen:codama

# Setup (one-time)
bash setup.sh
```

## Key architecture decisions

- **Pinocchio not Anchor**: Zero-copy `bytemuck` structs, manual validation, no realloc.
- **Static account sizes**: All accounts are fixed-size `#[repr(C)]` with discriminators. Adding fields = redeployment.
- **Two-tranche currently** (Junior + Senior). Three-tranche (Junior + Mezzanine + Senior) is the target design — mezzanine code not yet written.
- **Per-share HWM** (target): HWM = highest vault share price. New deposits are neutral. Per-NAV HWM is the current buggy implementation.
- **Fee exits to Trader wallet** (target): 20% performance fee as USDC transfer. Current code incorrectly reduces junior capital.
- **Frozen is a proper state** (target): `is_frozen` field + recovery waterfall. Current code uses `trading_enabled=0`.
- **No asset whitelist**: Any Jupiter-routable SPL token.
- **Shares are state fields** in `InvestorPosition` (u64), not SPL token mints.
- **Program ID**: `49StrXrpxCyC5VkmhossJLWx5nTCvyeoVMbPNMv9WcdN`

## Critical code bugs (verified)

1. **`graduate_vault` decrements `active_vaults`**: `update_nav.rs:280-283` calls `active_vaults.checked_sub(1)`. Should NOT decrement — graduation doesn't deactivate a vault. Remove this line.
2. **HWM incremented on deposits**: `deposit_senior.rs:197-204`, `deposit_junior.rs:106-113` add deposit amount to HWM. Should use per-share HWM instead.
3. **Performance fee reduces junior capital**: `claim_fees.rs:92-98` subtracts fee from `junior_capital` and `junior_shares_outstanding`. Should transfer USDC to Trader wallet.
4. **`create_vault` blocks second vault**: `create_vault.rs:77-79` checks `total_vaults != 0` and rejects. Trader can only create one vault.

## Naming

- **Trader** (not Manager). Code still uses `ManagerProfile`, `b"manager"` seeds, `KilnError`, `kiln-workspace` — legacy migration needed.
- **Arcadia** (not Kiln, not Port Protocol).
- Env var: `VITE_KILN_API_BASE_URL` — legacy name.

## Testing quirks

- Program tests use LiteSVM (not solana-test-validator). No validator needed.
- Frontend tests use Vitest + jsdom. Coverage patterns: `src/**/*.{test,spec}.{ts,tsx}`.
- Mock data lives in `app/src/lib/mockData.ts`. Replacing with on-chain data is Phase 2.
- `vitest.config.ts` sets up `@` alias and `./src/test/setup.ts`.

## Program account model

```
ManagerProfile    PDA: ["manager", manager_pubkey]            (discriminator=1)
VaultConfig       PDA: ["vault-config", manager, index]       (discriminator=2)
VaultState        PDA: ["vault-state", vault_config]          (discriminator=3)
InvestorPosition  PDA: ["investor-position", investor, vault] (discriminator=4)
Treasury          PDA: ["vault-treasury", vault_config]
PriceFeed         PDA: ["price-feed", feed_id]
```

## Instructions (discriminator mapping)

| # | Instruction | Status |
|---|-------------|--------|
| 0 | `init_manager` | Done |
| 1 | `create_vault` | Done (bug: one vault only) |
| 2 | `deposit_junior` | Done |
| 3 | `update_nav` | Done (lamport + USDC/WSOL paths) |
| 4 | `graduate_vault` | Done (bug: active_vaults--) |
| 5 | `deposit_senior` | Done (lamport + USDC paths) |
| 6 | `withdraw_senior` | Done (lamport + USDC/WSOL unwind paths) |
| 7 | `withdraw_junior` | Done (lamport + USDC paths) |
| 8 | `claim_fees` | Done (bug: fee stays in vault) |
| 9 | `execute_swap` | Done (guard-only + Jupiter CPI paths) |
| 10 | `update_oracle_price` | Done (devnet adapter) |

## Program parameter calibrations

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Junior capital ratio | 20% of total vault (minimum) | Trader skin-in-the-game enforced at protocol level |
| Senior expected return | 8-10% (at typical performance) | 2-4pp above Solana LST market (5.1-6.94%, TVL-weighted 5.80%) — not a guaranteed rate |
| Mezzanine expected return | 11-15% (at typical performance) | 1.5× Senior per-dollar weight compensates for second-loss risk |
| Profit split formula | 20% Trader + 5% Jr retention + 75% investor pool, split by weighted capital share (Mezz weight = 1.5× Senior) | On-chain constant, deterministic settlement |
| Position limits | 2× / 1.5× / 0.75× Junior at 100% / 60% / 20% health; locked below 20% | Prevents single-trade wipe on spot swaps |
| Mezzanine lockup | 7 days at launch (rises to 14d after 10 vaults mature) | Ribbon/Friktion: 7 days; dHEDGE: none; 7d is launch-competitive |
| Maturity wait | 90 days Active (fast track: immediate if Junior >=80% for 30d) | Program invariant; must match invariants.md |
| Maturity TVL gate | Senior TVL >= 3x Junior capital sustained for 10 trading days | Scales with vault size, removes cold-start barrier of $200K absolute |
| Trader Launchpad | 30 trades | Prevents graduation on passive USDC appreciation alone |
| Cooldown thresholds | Single trade >5%, 24h >10%, 7d >20% NAV drop | Raised for swap-only venue (no leverage/perps) |
| AUM management fee | 0.5% TVL / year | Accrued continuously, claimable monthly by Protocol Treasury |
| Protocol performance cut | 15% of Trader's 20% fee (3% net of gross gains) | Protocol earns from vault success, not just exits |
| Withdrawal fee | 0.1%, waived in Cooldown/Frozen/Closed/Emergency Exit | Don't tax investors for using safety mechanisms |
| Mezzanine capacity | 10-40% of Target Vault Size | Set at creation, immutable after graduation |
| Trading venue | Jupiter spot swaps only | No perps/leverage/options; keeps NAV + settlement deterministic |

## Three-tranche target (not yet implemented)

Fields to add to `VaultConfig`: `senior_floor_rate_bps`, `mezzanine_capacity_bps`.
Fields to add to `VaultState`: `mezzanine_capital`, `mezzanine_shares_outstanding`, `is_frozen`, `is_mature`, `matured_at`, `junior_health_check_start`.
New instructions needed: `deposit_mezzanine`, `withdraw_mezzanine`.

## Frontend stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3 + shadcn/ui (Radix primitives)
- Framer Motion for animations
- React Router v6 for routing
- TanStack Query for data fetching
- Recharts for charts
- Solana Wallet Adapter (v1) for wallet connection
- `@tanstack/react-query` for server state
- Dev server on port 5000, host 0.0.0.0

## Environment

```
VITE_RPC_URL=https://api.devnet.solana.com
VITE_KILN_API_BASE_URL=http://localhost:8080
```

## Solana MCP workflow

For Solana-related work, prefer the Solana Developer MCP tools over model memory.

Use `list_sections` first for non-trivial Solana questions so you can find the right documentation source ids and section ids.

Use `get_documentation` when you need canonical docs for a specific source, framework, library, or ecosystem area. Use `Solana_Documentation_Search` or `Solana_Expert__Ask_For_Help` for narrow how-to questions, errors, or API usage.

Whenever you write or modify Solana program Rust, call `program_autofixer` before returning code. It accepts `code`, optional `filename`, and optional `framework` (`auto`, `anchor`, or `pinocchio`). Apply the suggested fixes, then call `program_autofixer` again. Repeat until `require_another_tool_call_after_fixing` is false.

## Context docs location

- Glossary: `docs/context/CONTEXT.md`
- Invariants: `docs/context/invariants.md`
- Anti-concepts: `docs/context/anti-concepts.md`
- ADRs: `docs/adr/`
- State machines: `docs/state-machines/`
- Flows: `docs/flows/`
- Brand: `brand.md`
