import {
  type Action,
  type IAgentRuntime,
  type Memory,
  type HandlerCallback,
  type State,
  ModelClass,
  composeContext,
  generateText,
} from "@elizaos/core";
import { getTopCoins, getGlobalData, formatUSD, formatPct } from "../providers/coingecko.js";
import { getTopProtocols, getChainTVLs } from "../providers/defillama.js";

const BRIEFING_TEMPLATE = `You are Sentinel, a crypto research analyst. Generate a concise market briefing using the data below.

Structure your response as:
**Market Briefing — [Today's Date]**

**Summary:** 2-3 sentence overview of market conditions.

**Key Metrics:**
- List the most important numbers (BTC, ETH, SOL prices, total market cap, DeFi TVL)

**Top Movers:** Highlight 3-5 notable gainers/losers from the data.

**DeFi Snapshot:** Key DeFi trends from the TVL data.

**Analysis:** 2-3 sentences of market interpretation. Flag any risks.

**Sources:** CoinGecko, DeFiLlama

Here is the current market data:

{{marketData}}

User message: {{recentMessages}}`;

async function gatherMarketData(): Promise<string> {
  const [topCoins, globalData, protocols, chains] = await Promise.all([
    getTopCoins(20),
    getGlobalData(),
    getTopProtocols(10),
    getChainTVLs(),
  ]);

  const parts: string[] = [];

  if (globalData) {
    parts.push(`Global Market Cap: ${formatUSD(globalData.total_market_cap.usd)} (${formatPct(globalData.market_cap_change_percentage_24h_usd)} 24h)`);
    parts.push(`Global 24h Volume: ${formatUSD(globalData.total_volume.usd)}`);
  }

  if (topCoins.length > 0) {
    parts.push("\nTop 20 Coins:");
    for (const c of topCoins) {
      parts.push(
        `${c.name} (${c.symbol.toUpperCase()}): $${c.current_price.toLocaleString()} | MCap ${formatUSD(c.market_cap)} | 24h ${formatPct(c.price_change_percentage_24h)} | 7d ${formatPct(c.price_change_percentage_7d_in_currency)}`
      );
    }
  }

  if (chains.length > 0) {
    const totalTVL = chains.reduce((s, c) => s + c.tvl, 0);
    parts.push(`\nTotal DeFi TVL: ${formatUSD(totalTVL)}`);
    parts.push("Chain TVL:");
    for (const c of chains.slice(0, 10)) {
      parts.push(`  ${c.name}: ${formatUSD(c.tvl)}`);
    }
  }

  if (protocols.length > 0) {
    parts.push("\nTop Protocols:");
    for (const p of protocols) {
      parts.push(`  ${p.name}: ${formatUSD(p.tvl)} | 1d ${formatPct(p.change_1d)} | 7d ${formatPct(p.change_7d)}`);
    }
  }

  return parts.join("\n");
}

export const marketBriefingAction: Action = {
  name: "MARKET_BRIEFING",
  description:
    "Generate a comprehensive crypto market briefing with real-time prices, market cap, volume, DeFi TVL, and top movers from CoinGecko and DeFiLlama.",
  similes: [
    "MARKET_OVERVIEW",
    "MARKET_REPORT",
    "MARKET_UPDATE",
    "DAILY_BRIEFING",
    "CRYPTO_BRIEFING",
    "MARKET_SUMMARY",
    "WHATS_THE_MARKET_DOING",
  ],
  validate: async () => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    const marketData = await gatherMarketData();
    const context = composeContext({
      state: {
        ...state,
        marketData,
      } as State,
      template: BRIEFING_TEMPLATE,
    });

    const response = await generateText({
      runtime,
      context,
      modelClass: ModelClass.LARGE,
    });

    if (callback) {
      await callback({ text: response, action: "MARKET_BRIEFING" });
    }
    return true;
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Give me a market briefing" } },
      { user: "{{agentName}}", content: { text: "Generating your market briefing with the latest data...", action: "MARKET_BRIEFING" } },
    ],
    [
      { user: "{{user1}}", content: { text: "What's the market doing today?" } },
      { user: "{{agentName}}", content: { text: "Let me pull the latest market data for your briefing...", action: "MARKET_BRIEFING" } },
    ],
  ],
};
