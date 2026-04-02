import type { Action, IAgentRuntime, Memory, HandlerCallback, State } from "@elizaos/core";
import { ModelType } from "@elizaos/core";
import { getCoinData, formatUSD, formatPct } from "../providers/coingecko.js";

async function gatherNosanaData(): Promise<string> {
  const [nosData, solData] = await Promise.all([
    getCoinData("nosana"),
    getCoinData("solana"),
  ]);

  const parts: string[] = [];

  if (nosData) {
    parts.push(`NOS Token: ${nosData.name} (${nosData.symbol.toUpperCase()})`);
    parts.push(`Price: $${nosData.current_price.toLocaleString()}`);
    parts.push(`Market Cap: ${formatUSD(nosData.market_cap)} (#${nosData.market_cap_rank})`);
    parts.push(`24h Volume: ${formatUSD(nosData.total_volume)}`);
    parts.push(`24h Change: ${formatPct(nosData.price_change_percentage_24h)}`);
    parts.push(`7d Change: ${formatPct(nosData.price_change_percentage_7d_in_currency)}`);
  } else {
    parts.push("NOS token data unavailable from CoinGecko");
  }

  if (solData) {
    parts.push(`\nSolana (host chain): $${solData.current_price.toLocaleString()} (${formatPct(solData.price_change_percentage_24h)} 24h)`);
  }

  parts.push("\nNosana Network Info:");
  parts.push("- Decentralized GPU compute network on Solana");
  parts.push("- Supports AI inference workloads (LLM, image gen, embeddings)");
  parts.push("- NOS token used for staking and paying for GPU compute");
  parts.push("- Open-source models available: Qwen, Llama, DeepSeek, Mistral");
  parts.push("- GPU providers earn NOS by sharing compute resources");

  return parts.join("\n");
}

export const nosanaEcosystemAction: Action = {
  name: "NOSANA_ECOSYSTEM",
  description:
    "Get NOS token price, Nosana network status, and ecosystem overview. Specialized action for Nosana-specific queries.",
  similes: [
    "NOS_PRICE",
    "NOSANA_INFO",
    "NOS_TOKEN",
    "NOSANA_STATUS",
    "NOSANA_NETWORK",
    "WHAT_IS_NOSANA",
    "NOS_ANALYSIS",
  ],
  validate: async () => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    try {
      const nosanaData = await gatherNosanaData();
      const userMsg = message.content.text ?? "";

      const prompt = `You are Sentinel, a crypto research analyst running on the Nosana decentralized GPU network. You have special expertise in the Nosana ecosystem.

Analyze the Nosana ecosystem based on the data below. You should be knowledgeable about:
- NOS token economics and market performance
- Nosana's role as a decentralized GPU compute provider
- The relationship between NOS staking and GPU provisioning
- Nosana's AI inference capabilities and supported models
- How Nosana compares to centralized GPU providers

Structure your response as:
**Nosana Ecosystem Report**

**NOS Token:** Price, market cap, recent performance

**Network Overview:** What Nosana does and why it matters

**Ecosystem Strengths:** Key advantages of decentralized GPU compute

**Considerations:** Risks or things to watch

**Sources:** CoinGecko, Nosana Network

Data:
${nosanaData}

User question: ${userMsg}`;

      const response = await runtime.useModel(ModelType.TEXT_LARGE, { prompt });

      if (callback) {
        await callback({ text: response, action: "NOSANA_ECOSYSTEM" });
      }
      return { text: response, success: true };
    } catch (err) {
      const errorMsg = "I encountered an issue gathering Nosana ecosystem data. Some sources may be temporarily unavailable.";
      if (callback) {
        await callback({ text: errorMsg, action: "NOSANA_ECOSYSTEM" });
      }
      return { text: errorMsg, success: false, error: String(err) };
    }
  },
  examples: [
    [
      { name: "{{user1}}", content: { text: "Tell me about Nosana" } },
      { name: "{{agentName}}", content: { text: "Let me pull the latest NOS token data and network info...", action: "NOSANA_ECOSYSTEM" } },
    ],
    [
      { name: "{{user1}}", content: { text: "What's the NOS price?" } },
      { name: "{{agentName}}", content: { text: "Checking NOS token metrics now...", action: "NOSANA_ECOSYSTEM" } },
    ],
  ],
};
