import type { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";

const DATA_SOURCES = [
  { tag: "[CoinGecko", name: "CoinGecko", weight: 3 },
  { tag: "[DeFiLlama", name: "DeFiLlama", weight: 3 },
  { tag: "[Solana On-Chain", name: "Solana RPC", weight: 2 },
  { tag: "[Crypto News", name: "RSS Feeds", weight: 2 },
];

export const sourceQualityEvaluator: Evaluator = {
  name: "SOURCE_QUALITY",
  description:
    "Evaluates the quality and breadth of data sources used in the agent's response. More diverse sources = higher confidence.",
  similes: ["CONFIDENCE_CHECK", "SOURCE_BREADTH"],
  alwaysRun: true,
  validate: async (
    _runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    const text = message.content.text ?? "";
    return DATA_SOURCES.some((s) => text.includes(s.tag));
  },
  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ) => {
    const text = message.content.text ?? "";
    const activeSources: string[] = [];
    let totalWeight = 0;

    for (const source of DATA_SOURCES) {
      if (text.includes(source.tag)) {
        activeSources.push(source.name);
        totalWeight += source.weight;
      }
    }

    const maxWeight = DATA_SOURCES.reduce((s, d) => s + d.weight, 0);
    const confidence = Math.round((totalWeight / maxWeight) * 100);

    return {
      success: activeSources.length >= 2,
      text: `Source confidence: ${confidence}% (${activeSources.join(", ")})`,
      data: { confidence, activeSources },
    };
  },
  examples: [
    {
      prompt: "Agent response uses data from multiple providers",
      messages: [
        { name: "{{user1}}", content: { text: "Give me a full research report" } },
      ],
      outcome: "Calculate confidence score based on number and weight of active data sources",
    },
  ],
};
