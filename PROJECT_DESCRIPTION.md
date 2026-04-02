# Sentinel -- Project Description (Nosana x ElizaOS Builders Challenge)

**Sentinel** is a personal crypto research agent that transforms raw blockchain and market data into actionable intelligence briefings -- powered entirely by decentralized infrastructure.

## The Problem

Crypto research today means juggling dozens of tabs: CoinGecko for prices, DeFiLlama for TVL, Twitter for news, block explorers for on-chain data. Centralized research platforms gate this behind expensive subscriptions and harvest your data. There's no personal, private, always-available research analyst.

## The Solution

Sentinel is an ElizaOS agent with a custom plugin that aggregates four real-time data sources -- CoinGecko (market data), DeFiLlama (DeFi TVL/protocols), crypto news RSS feeds (CoinDesk, CoinTelegraph, The Block), and Solana's public RPC (on-chain metrics) -- and synthesizes them through Qwen3.5-27B running on Nosana's decentralized GPU network.

**Four core capabilities:**
- **Market Briefings:** Full market overview with prices, volume, DeFi TVL, and top movers
- **Token Analysis:** Deep-dive on any token combining price data with DeFi protocol metrics
- **News Digests:** Aggregated and summarized headlines from three major crypto outlets
- **Research Topics:** Open-ended research queries using all data sources simultaneously

## Why It Matters

- **Zero API keys required** -- every data source is free and open, so anyone can run it
- **Graceful degradation** -- if sources are down, the agent works with what's available and says so
- **Structured output** -- every response follows Summary > Data > Analysis > Sources format
- **Decentralized end-to-end** -- inference on Nosana GPUs, data from open APIs, no centralized dependencies

Sentinel embodies the OpenClaw philosophy: your research, your data, your infrastructure. No middleman between you and market intelligence.

**Tech:** ElizaOS v2 / TypeScript / 4 providers / 4 actions / 2 evaluators / Qwen3.5-27B on Nosana / Docker
