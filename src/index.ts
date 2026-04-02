import type { Plugin, Project } from "@elizaos/core";

import { coingeckoProvider } from "./providers/coingecko.js";
import { defillamaProvider } from "./providers/defillama.js";
import { rssFeedProvider } from "./providers/rssFeed.js";
import { solanaOnChainProvider } from "./providers/solanaOnChain.js";

import { marketBriefingAction } from "./actions/marketBriefing.js";
import { tokenAnalysisAction } from "./actions/tokenAnalysis.js";
import { newsDigestAction } from "./actions/newsDigest.js";
import { researchTopicAction } from "./actions/researchTopic.js";
import { nosanaEcosystemAction } from "./actions/nosanaEcosystem.js";

import { freshnessEvaluator } from "./evaluators/freshness.js";
import { sourceQualityEvaluator } from "./evaluators/sourceQuality.js";

import sentinelCharacter from "../characters/sentinel.character.json";

const sentinelPlugin: Plugin = {
  name: "plugin-sentinel",
  description:
    "Personal crypto research agent plugin. Aggregates real-time data from CoinGecko, DeFiLlama, Solana RPC, and crypto news feeds to deliver market briefings, token analyses, news digests, and deep-dive research.",
  actions: [
    marketBriefingAction,
    tokenAnalysisAction,
    newsDigestAction,
    researchTopicAction,
    nosanaEcosystemAction,
  ],
  providers: [
    coingeckoProvider,
    defillamaProvider,
    rssFeedProvider,
    solanaOnChainProvider,
  ],
  evaluators: [
    freshnessEvaluator,
    sourceQualityEvaluator,
  ],
};

const project: Project = {
  agents: [
    {
      character: sentinelCharacter,
      plugins: [sentinelPlugin],
    },
  ],
};

export default project;
