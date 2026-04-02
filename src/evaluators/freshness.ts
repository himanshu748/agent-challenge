import {
  type Evaluator,
  type IAgentRuntime,
  type Memory,
  type State,
} from "@elizaos/core";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function extractTimestamps(text: string): Date[] {
  const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g;
  const matches = text.match(isoRegex) ?? [];
  return matches.map((m) => new Date(m)).filter((d) => !isNaN(d.getTime()));
}

export const freshnessEvaluator: Evaluator = {
  name: "FRESHNESS_CHECK",
  description:
    "Evaluates whether the data used in the agent's response is fresh (within 5 minutes). Flags stale data so the agent can warn the user.",
  similes: ["DATA_FRESHNESS", "STALE_CHECK"],
  alwaysRun: true,
  validate: async (
    _runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    const text = message.content.text ?? "";
    return text.includes("[CoinGecko") || text.includes("[DeFiLlama") || text.includes("[Solana") || text.includes("[Crypto News");
  },
  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ): Promise<void> => {
    const text = message.content.text ?? "";
    const timestamps = extractTimestamps(text);
    const now = Date.now();

    for (const ts of timestamps) {
      const age = now - ts.getTime();
      if (age > STALE_THRESHOLD_MS) {
        console.warn(
          `[Freshness] Stale data detected: ${ts.toISOString()} is ${Math.round(age / 1000)}s old`
        );
      }
    }
  },
  examples: [
    {
      context: "Agent response contains market data with timestamps",
      messages: [
        { user: "{{user1}}", content: { text: "Market briefing please" } },
      ],
      outcome: "Check if data timestamps are within 5 minutes of current time",
    },
  ],
};
