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
import { getCoinData, formatUSD, formatPct } from "../providers/coingecko.js";
import { getProtocolByName } from "../providers/defillama.js";

const TOKEN_TEMPLATE = `You are Sentinel, a crypto research analyst. Analyze the token based on the data below.

Structure your response as:
**Token Analysis: [TOKEN NAME] ([SYMBOL])**

**Price & Market Data:**
- Current price, market cap, rank, 24h volume, price changes

**DeFi Presence:** (if available)
- TVL data, protocol info, chain presence

**Strengths:** 2-3 bullet points on positive indicators

**Risk Factors:** 2-3 bullet points on risks or concerns

**Analysis:** 2-3 sentence interpretation of the data.

**Sources:** CoinGecko, DeFiLlama

Here is the token data:

{{tokenData}}

User message: {{recentMessages}}`;

function extractTokenId(text: string): string {
  const lower = text.toLowerCase();
  const tokenMap: Record<string, string> = {
    btc: "bitcoin", bitcoin: "bitcoin",
    eth: "ethereum", ethereum: "ethereum",
    sol: "solana", solana: "solana",
    bnb: "binancecoin", binance: "binancecoin",
    xrp: "ripple", ripple: "ripple",
    ada: "cardano", cardano: "cardano",
    doge: "dogecoin", dogecoin: "dogecoin",
    dot: "polkadot", polkadot: "polkadot",
    avax: "avalanche-2", avalanche: "avalanche-2",
    matic: "matic-network", polygon: "matic-network",
    link: "chainlink", chainlink: "chainlink",
    uni: "uniswap", uniswap: "uniswap",
    aave: "aave",
    mkr: "maker", maker: "maker",
    nos: "nosana", nosana: "nosana",
    jup: "jupiter-exchange-solana", jupiter: "jupiter-exchange-solana",
    ray: "raydium", raydium: "raydium",
    jto: "jito-governance-token", jito: "jito-governance-token",
    sui: "sui", apt: "aptos", aptos: "aptos",
    arb: "arbitrum", arbitrum: "arbitrum",
    op: "optimism", optimism: "optimism",
    atom: "cosmos", cosmos: "cosmos",
    near: "near", fil: "filecoin", filecoin: "filecoin",
    stx: "blockstack", icp: "internet-computer",
    ton: "the-open-network", tia: "celestia", celestia: "celestia",
    render: "render-token", rndr: "render-token",
    wif: "dogwifcoin", bonk: "bonk", pepe: "pepe",
    ldo: "lido-dao", lido: "lido-dao",
    crv: "curve-dao-token", curve: "curve-dao-token",
    pendle: "pendle", eigen: "eigenlayer",
    pyth: "pyth-network",
  };

  for (const [key, id] of Object.entries(tokenMap)) {
    if (lower.includes(key)) return id;
  }

  const words = lower.split(/\s+/);
  for (const w of words) {
    if (w.length >= 2 && !["me", "the", "for", "can", "you", "analyze", "analysis", "token", "about", "tell", "what", "how", "is"].includes(w)) {
      return w;
    }
  }
  return "bitcoin";
}

async function gatherTokenData(tokenId: string): Promise<string> {
  const [coinData, protocolData] = await Promise.all([
    getCoinData(tokenId),
    getProtocolByName(tokenId),
  ]);

  const parts: string[] = [];

  if (coinData) {
    parts.push(`Token: ${coinData.name} (${coinData.symbol.toUpperCase()})`);
    parts.push(`Price: $${coinData.current_price.toLocaleString()}`);
    parts.push(`Market Cap: ${formatUSD(coinData.market_cap)} (#${coinData.market_cap_rank})`);
    parts.push(`24h Volume: ${formatUSD(coinData.total_volume)}`);
    parts.push(`24h Change: ${formatPct(coinData.price_change_percentage_24h)}`);
    parts.push(`7d Change: ${formatPct(coinData.price_change_percentage_7d_in_currency)}`);
  } else {
    parts.push(`Token "${tokenId}" not found on CoinGecko. Data may be limited.`);
  }

  if (protocolData) {
    parts.push(`\nDeFi Protocol: ${protocolData.name}`);
    parts.push(`Category: ${protocolData.category}`);
    parts.push(`TVL: ${formatUSD(protocolData.tvl)}`);
    parts.push(`1d TVL Change: ${formatPct(protocolData.change_1d)}`);
    parts.push(`7d TVL Change: ${formatPct(protocolData.change_7d)}`);
    parts.push(`Chains: ${protocolData.chains.join(", ")}`);
  }

  return parts.join("\n");
}

export const tokenAnalysisAction: Action = {
  name: "TOKEN_ANALYSIS",
  description:
    "Analyze a specific cryptocurrency token with price data from CoinGecko and DeFi metrics from DeFiLlama.",
  similes: [
    "ANALYZE_TOKEN",
    "TOKEN_REPORT",
    "COIN_ANALYSIS",
    "RESEARCH_TOKEN",
    "TOKEN_INFO",
    "TELL_ME_ABOUT_TOKEN",
  ],
  validate: async () => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    const tokenId = extractTokenId(message.content.text ?? "");
    const tokenData = await gatherTokenData(tokenId);

    const context = composeContext({
      state: {
        ...state,
        tokenData,
      } as State,
      template: TOKEN_TEMPLATE,
    });

    const response = await generateText({
      runtime,
      context,
      modelClass: ModelClass.LARGE,
    });

    if (callback) {
      await callback({ text: response, action: "TOKEN_ANALYSIS" });
    }
    return true;
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Analyze SOL for me" } },
      { user: "{{agentName}}", content: { text: "Pulling Solana data for analysis...", action: "TOKEN_ANALYSIS" } },
    ],
    [
      { user: "{{user1}}", content: { text: "Tell me about Ethereum" } },
      { user: "{{agentName}}", content: { text: "Fetching Ethereum metrics from multiple sources...", action: "TOKEN_ANALYSIS" } },
    ],
  ],
};
