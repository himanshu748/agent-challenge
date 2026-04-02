import type { Provider, IAgentRuntime, Memory, State, ProviderResult } from "@elizaos/core";
import { cached } from "../utils/cache.js";

const DEFILLAMA_BASE = "https://api.llama.fi";
const CACHE_TTL = 120_000; // 2 min

interface Protocol {
  name: string;
  tvl: number;
  chain: string;
  chains: string[];
  change_1d: number | null;
  change_7d: number | null;
  category: string;
}

interface ChainTVL {
  name: string;
  tvl: number;
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getAllProtocols(): Promise<Protocol[]> {
  return cached("dl:protocols", CACHE_TTL, async () => {
    const data = await fetchJSON<Protocol[]>(`${DEFILLAMA_BASE}/protocols`);
    return data ?? [];
  });
}

async function getTopProtocols(limit = 15): Promise<Protocol[]> {
  const data = await getAllProtocols();
  return data.filter((p) => p.tvl > 0).sort((a, b) => b.tvl - a.tvl).slice(0, limit);
}

async function getChainTVLs(): Promise<ChainTVL[]> {
  return cached("dl:chains", CACHE_TTL, async () => {
    const data = await fetchJSON<ChainTVL[]>(`${DEFILLAMA_BASE}/v2/chains`);
    if (!data) return [];
    return data.sort((a, b) => b.tvl - a.tvl).slice(0, 15);
  });
}

async function getProtocolByName(name: string): Promise<Protocol | null> {
  const data = await getAllProtocols();
  const lower = name.toLowerCase();
  return data.find((p) => p.name.toLowerCase() === lower || p.name.toLowerCase().includes(lower)) ?? null;
}

function formatUSD(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function formatPct(n: number | null): string {
  if (n == null) return "N/A";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export const defillamaProvider: Provider = {
  name: "defillama",
  description: "DeFi protocol TVL data from DeFiLlama",
  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const [protocols, chains] = await Promise.all([
      getTopProtocols(10),
      getChainTVLs(),
    ]);

    const parts: string[] = ["[DeFiLlama TVL Data]"];
    const timestamp = new Date().toISOString();
    parts.push(`Fetched: ${timestamp}`);

    if (chains.length > 0) {
      const totalTVL = chains.reduce((sum, c) => sum + c.tvl, 0);
      parts.push(`\nTotal DeFi TVL: ${formatUSD(totalTVL)}`);
      parts.push("\nTop Chains by TVL:");
      for (const c of chains.slice(0, 10)) {
        parts.push(`  ${c.name}: ${formatUSD(c.tvl)}`);
      }
    } else {
      parts.push("\nChain TVL data: unavailable");
    }

    if (protocols.length > 0) {
      parts.push("\nTop Protocols by TVL:");
      for (const p of protocols) {
        parts.push(
          `  ${p.name} (${p.category}): ${formatUSD(p.tvl)} | 1d ${formatPct(p.change_1d)} | 7d ${formatPct(p.change_7d)} | Chains: ${p.chains.slice(0, 3).join(", ")}`
        );
      }
    } else {
      parts.push("\nProtocol data: unavailable");
    }

    return { text: parts.join("\n") };
  },
};

export { getTopProtocols, getChainTVLs, getProtocolByName };
