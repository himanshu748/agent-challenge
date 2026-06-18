# Jupiter Developer Platform DX Report

Project: Jupiter Anomaly Scout  
Date: 2026-06-17  
Builder: Codex agent working toward the Superteam Earn agent bounty

## Summary

I built a small static app that calls Jupiter Price API v3 and converts token data into simple strategy suggestions for DCA, trigger-order, or observe-only workflows.

The strongest part of the developer experience was that a public Price v3 endpoint worked immediately:

```text
GET https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112
```

That returned a useful JSON payload with `usdPrice`, `liquidity`, `blockId`, `decimals`, and `priceChange24h`.

The weakest part was documentation discovery from an agent workflow. Several obvious doc paths or advertised LLM-style paths returned app-shell/404 pages instead of readable docs:

```text
https://developers.jup.ag/llms.txt -> 404 HTML app shell
https://developers.jup.ag/llms-full.txt -> 404 HTML app shell
https://developers.jup.ag/docs/api/price-api/v3/price -> 404 HTML app shell
https://developers.jup.ag/sitemap.xml -> 404 HTML app shell
```

For a bounty explicitly encouraging AI agents and the AI stack, this matters. A coding agent should be able to discover canonical API docs without relying on search engine luck or guessed endpoints.

## Time To First API Call

Approximate time from starting docs/API discovery to first successful API call: 10-15 minutes.

Most of that time was not spent writing code. It was spent finding a concrete endpoint that returned JSON instead of a rendered developer-platform page or a 404 shell.

## What Worked Well

- `lite-api.jup.ag/price/v3` responded quickly and did not require account setup for the basic Price API call used in this prototype.
- The Price v3 response shape is useful for signal products because it includes more than just price. `liquidity` and `priceChange24h` make simple risk filters possible without a second data provider.
- The JSON response is easy to consume from browser JavaScript.
- The endpoint is composable: sending multiple token mints in `ids` makes it easy to build a watchlist.

## Where The APIs Bit Me

- I had to infer the correct Price v3 URL. The most natural docs URLs I tried returned 404 HTML rather than API-specific docs.
- Error responses from docs discovery were not agent-friendly. A 404 page with a large Next.js shell is noisy and hard to distinguish from a route typo, auth wall, or docs migration.
- The public API worked, but it was unclear from the first pass which endpoints require a Developer Platform key and which are open.
- There was no obvious machine-readable OpenAPI spec discovered from the developer root during this pass.

## AI Stack Feedback

I did not have access to a callable Jupiter Docs MCP or Jupiter CLI in this Codex session. I tried the advertised `llms.txt` style paths on the Developer Platform domain and received 404 pages.

For agent builders, I would recommend:

1. Put a working `llms.txt` at the platform root.
2. Add `/.well-known/ai-plugin.json` or a clearly linked machine-readable index if MCP/CLI docs live somewhere else.
3. Include copy-paste agent prompts for common tasks:
   - fetch token metadata
   - fetch price
   - create trigger order
   - create recurring DCA
   - simulate swap route
4. Publish a small "agent smoke test" script that verifies API key presence and calls one endpoint from each major API family.

## How I Would Rebuild The Developer Onboarding

I would make the first screen developer-actionable before dashboard-oriented:

- Step 1: create or paste API key
- Step 2: choose an API family
- Step 3: show a runnable cURL request
- Step 4: show the same call in TypeScript and Python
- Step 5: show live response schema and rate-limit/auth notes
- Step 6: one-click export to `jupiter.config.json`

For agents, I would add a `/agent-start` page with:

- canonical docs index
- API base URLs
- auth model by endpoint
- OpenAPI files
- MCP setup
- CLI install command
- known endpoint examples
- "do not use these deprecated paths" section

## What I Wish Existed

- A canonical `llms.txt` and `llms-full.txt` that return markdown, not a 404 app shell.
- A small OpenAPI bundle per API family.
- A visible table showing which endpoints work without a key and which require Developer Platform auth.
- Browser-safe examples for read-only APIs.
- A local emulator/mock mode for Trigger and Recurring so builders can demo strategy logic without risking real orders.
- A "DX report packet" export in the Developer Platform that summarizes API calls made by a key during the bounty window.

## Project Limitations

The prototype only uses Price v3 because I do not have the user's Jupiter Developer Platform API key or email in this workspace. It intentionally does not execute trades, create trigger orders, or place DCA orders.

The next version should connect the same anomaly score to:

- Trigger API for take-profit or laddered buy ideas
- Recurring API for DCA cadence adjustment
- Tokens API for metadata and organic score filters

## Submission Checklist

- Public project link: https://github.com/himanshu748/agent-challenge/tree/main/superteam-jupiter-anomaly-scout
- Public DX report link: https://github.com/himanshu748/agent-challenge/blob/main/superteam-jupiter-anomaly-scout/DX-REPORT.md
- Jupiter Developer Platform email: requires user input
- API key usage cross-reference: requires user-owned key
