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
import { getAllNews } from "../providers/rssFeed.js";

const NEWS_TEMPLATE = `You are Sentinel, a crypto research analyst. Create a news digest from the headlines below.

Structure your response as:
**Crypto News Digest**

**Top Stories:**
Summarize the 5 most important/impactful headlines. For each:
- One-line summary of what happened
- Why it matters (brief)

**Trends:** 1-2 sentences on recurring themes across the headlines.

**Sources:** List the news outlets that provided data.

Here are the latest crypto headlines:

{{newsData}}

User message: {{recentMessages}}`;

export const newsDigestAction: Action = {
  name: "NEWS_DIGEST",
  description:
    "Aggregate and summarize the latest cryptocurrency news from multiple RSS feeds (CoinDesk, CoinTelegraph, The Block).",
  similes: [
    "CRYPTO_NEWS",
    "LATEST_NEWS",
    "NEWS_SUMMARY",
    "WHATS_NEW",
    "NEWS_UPDATE",
    "HEADLINES",
  ],
  validate: async () => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    const news = await getAllNews();

    let newsData: string;
    if (news.length > 0) {
      const lines = news.map(
        (item, i) =>
          `${i + 1}. [${item.source}] ${item.title} (${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "recent"})`
      );
      newsData = lines.join("\n");
    } else {
      newsData = "No news headlines available at this time. RSS feeds may be rate-limited.";
    }

    const context = composeContext({
      state: {
        ...state,
        newsData,
      } as State,
      template: NEWS_TEMPLATE,
    });

    const response = await generateText({
      runtime,
      context,
      modelClass: ModelClass.LARGE,
    });

    if (callback) {
      await callback({ text: response, action: "NEWS_DIGEST" });
    }
    return true;
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "What's the latest crypto news?" } },
      { user: "{{agentName}}", content: { text: "Pulling the latest headlines from crypto news feeds...", action: "NEWS_DIGEST" } },
    ],
    [
      { user: "{{user1}}", content: { text: "Give me a news digest" } },
      { user: "{{agentName}}", content: { text: "Aggregating news from multiple sources...", action: "NEWS_DIGEST" } },
    ],
  ],
};
