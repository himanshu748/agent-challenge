import type { Provider, IAgentRuntime, Memory, State, ProviderResult } from "@elizaos/core";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

interface RPCResponse<T> {
  result: T;
}

interface EpochInfo {
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  absoluteSlot: number;
  blockHeight: number;
  transactionCount: number;
}

interface PerfSample {
  numTransactions: number;
  numSlots: number;
  samplePeriodSecs: number;
  slot: number;
}

interface Supply {
  value: {
    total: number;
    circulating: number;
    nonCirculating: number;
  };
}

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T | null> {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RPCResponse<T>;
    return data.result;
  } catch {
    return null;
  }
}

async function getEpochInfo(): Promise<EpochInfo | null> {
  return rpcCall<EpochInfo>("getEpochInfo");
}

async function getRecentPerformance(): Promise<PerfSample[]> {
  const data = await rpcCall<PerfSample[]>("getRecentPerformanceSamples", [5]);
  return data ?? [];
}

async function getSupply(): Promise<Supply | null> {
  return rpcCall<Supply>("getSupply");
}

function formatSOL(lamports: number): string {
  const sol = lamports / 1e9;
  if (sol >= 1e9) return `${(sol / 1e9).toFixed(2)}B SOL`;
  if (sol >= 1e6) return `${(sol / 1e6).toFixed(2)}M SOL`;
  return `${sol.toFixed(0)} SOL`;
}

export const solanaOnChainProvider: Provider = {
  name: "solanaOnChain",
  description: "Solana blockchain on-chain data via RPC",
  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const [epochInfo, perfSamples, supply] = await Promise.all([
      getEpochInfo(),
      getRecentPerformance(),
      getSupply(),
    ]);

    const parts: string[] = ["[Solana On-Chain Data]"];
    const timestamp = new Date().toISOString();
    parts.push(`Fetched: ${timestamp}`);

    if (epochInfo) {
      parts.push(`\nEpoch: ${epochInfo.epoch}`);
      parts.push(`Block Height: ${epochInfo.blockHeight.toLocaleString()}`);
      parts.push(`Total Transactions: ${epochInfo.transactionCount?.toLocaleString() ?? "N/A"}`);
      const epochProgress = ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(1);
      parts.push(`Epoch Progress: ${epochProgress}%`);
    } else {
      parts.push("\nEpoch data: unavailable (RPC error)");
    }

    if (perfSamples.length > 0) {
      const avgTps =
        perfSamples.reduce((sum, s) => sum + s.numTransactions / s.samplePeriodSecs, 0) /
        perfSamples.length;
      parts.push(`\nAvg TPS (recent): ${avgTps.toFixed(0)}`);
    }

    if (supply) {
      parts.push(`\nTotal Supply: ${formatSOL(supply.value.total)}`);
      parts.push(`Circulating: ${formatSOL(supply.value.circulating)}`);
      parts.push(`Non-Circulating: ${formatSOL(supply.value.nonCirculating)}`);
    } else {
      parts.push("\nSupply data: unavailable");
    }

    return { text: parts.join("\n") };
  },
};

export { getEpochInfo, getRecentPerformance, getSupply };
