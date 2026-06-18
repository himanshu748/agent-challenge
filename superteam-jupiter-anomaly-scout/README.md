# Jupiter Anomaly Scout

A small, dependency-free bounty prototype that uses Jupiter Price API v3 to turn token moves into simple DCA, limit-order, or observe-only strategy ideas.

## Live-ish Demo

Open the static app through jsDelivr:

https://cdn.jsdelivr.net/gh/himanshu748/agent-challenge@main/superteam-jupiter-anomaly-scout/index.html

Repository folder:

https://github.com/himanshu748/agent-challenge/tree/main/superteam-jupiter-anomaly-scout

## What It Does

- Calls `https://lite-api.jup.ag/price/v3?ids=...`
- Tracks SOL, JUP, USDC, BONK, WIF, and PYTH
- Computes a lightweight anomaly score from 24h price change and liquidity
- Suggests a strategy mode:
  - DCA: adjust tranche sizing
  - Limit: stage trigger-order ideas
  - Observe: avoid execution until another sample confirms the move
- Shows the raw API trace so reviewers can see exactly what happened

## Run Locally

Open `index.html` in a browser.

No build step is required.

## Submission Notes

This is not a trading bot and does not execute orders. The bounty-ready next step would connect the signal layer to Jupiter Trigger or Recurring APIs after a user-owned Jupiter Developer Platform key is available.
