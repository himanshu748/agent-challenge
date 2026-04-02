import type { Provider, IAgentRuntime, Memory, State, ProviderResult } from "@elizaos/core";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
}

interface GlobalData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
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

async function getTopCoins(limit = 20): Promise<CoinMarketData[]> {
  const data = await fetchJSON<CoinMarketData[]>(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=7d`
  );
  return data ?? [];
}

async function getGlobalData(): Promise<GlobalData | null> {
  const data = await fetchJSON<{ data: GlobalData }>(`${COINGECKO_BASE}/global`);
  return data?.data ?? null;
}

async function getCoinData(coinId: string): Promise<CoinMarketData | null> {
  const coins = await fetchJSON<CoinMarketData[]>(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false&price_change_percentage=7d`
  );
  return coins?.[0] ?? null;
}

function formatUSD(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return "N/A";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export const coingeckoProvider: Provider = {
  name: "coingecko",
  description: "Real-time cryptocurrency market data from CoinGecko",
  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const [topCoins, globalData] = await Promise.all([
      getTopCoins(10),
      getGlobalData(),
    ]);

    const parts: string[] = ["[CoinGecko Market Data]"];
    const timestamp = new Date().toISOString();
    parts.push(`Fetched: ${timestamp}`);

    if (globalData) {
      parts.push(
        `\nGlobal: Market Cap ${formatUSD(globalData.total_market_cap.usd)} (${formatPct(globalData.market_cap_change_percentage_24h_usd)} 24h) | 24h Volume ${formatUSD(globalData.total_volume.usd)}`
      );
    } else {
      parts.push("\nGlobal data: unavailable (API rate limit or error)");
    }

    if (topCoins.length > 0) {
      parts.push("\nTop 10 by Market Cap:");
      for (const c of topCoins) {
        parts.push(
          `  #${c.market_cap_rank} ${c.name} (${c.symbol.toUpperCase()}): $${c.current_price.toLocaleString()} | MCap ${formatUSD(c.market_cap)} | Vol ${formatUSD(c.total_volume)} | 24h ${formatPct(c.price_change_percentage_24h)} | 7d ${formatPct(c.price_change_percentage_7d_in_currency)}`
        );
      }
    } else {
      parts.push("\nTop coins data: unavailable");
    }

    return { text: parts.join("\n") };
  },
};

export { getTopCoins, getGlobalData, getCoinData, formatUSD, formatPct };
