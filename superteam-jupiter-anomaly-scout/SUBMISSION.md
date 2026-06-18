# Superteam / Jupiter Submission

## Project

Jupiter Anomaly Scout

## What It Is

A compact browser dashboard that uses Jupiter Price API v3 to watch a Solana token basket and convert price/liquidity movement into strategy ideas for:

- DCA cadence adjustments
- Trigger-order staging ideas
- Observe-only risk mode

It is intentionally not a trading bot. It demonstrates the signal layer that could later be wired into Jupiter Trigger and Recurring APIs once a user-owned Jupiter Developer Platform API key is available.

## APIs Used

- `GET https://lite-api.jup.ag/price/v3?ids=...`

The app tries live browser fetch first, then falls back to `prices-snapshot.json`, a captured Jupiter Price v3 response, then labeled sample data for tokens omitted from a response.

## Files

- `index.html` - app shell
- `styles.css` - responsive dashboard styling
- `app.js` - Price API fetch, anomaly scoring, strategy rendering
- `prices-snapshot.json` - captured Jupiter Price v3 response
- `DX-REPORT.md` - detailed developer experience report
- `README.md` - run notes

## How To Run

Open `index.html` in a browser or serve the directory with any static server.

```bash
python3 -m http.server 8765
```

## Public Links

Project folder:

https://github.com/himanshu748/agent-challenge/tree/main/superteam-jupiter-anomaly-scout

Static app via jsDelivr:

https://cdn.jsdelivr.net/gh/himanshu748/agent-challenge@main/superteam-jupiter-anomaly-scout/index.html

DX report:

https://github.com/himanshu748/agent-challenge/blob/main/superteam-jupiter-anomaly-scout/DX-REPORT.md

## DX Report Summary

The Price v3 endpoint was easy to consume once found. The main friction was docs discovery for agents:

- `https://developers.jup.ag/llms.txt` returned a 404 HTML app shell
- `https://developers.jup.ag/llms-full.txt` returned a 404 HTML app shell
- a guessed Price API docs path returned a 404 HTML app shell
- the public Price v3 endpoint worked and returned useful JSON

The report recommends a canonical `llms.txt`, OpenAPI bundles, endpoint auth matrix, and agent smoke-test scripts.
