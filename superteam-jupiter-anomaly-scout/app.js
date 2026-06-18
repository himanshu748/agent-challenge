const TOKENS = [
  { symbol: "SOL", name: "Wrapped SOL", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "JUP", name: "Jupiter", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3VnWbD5XW7muX2o4f8tJYpPB263" },
  { symbol: "WIF", name: "dogwifhat", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLz9LmFddfVLT" },
  { symbol: "PYTH", name: "Pyth Network", mint: "HZ1JovNiVvGrGNiiYvEozEVg6YhBQAa3kK1iYvSEyVtE" }
];

const SAMPLE = {
  So11111111111111111111111111111111111111112: { usdPrice: 73.81, priceChange24h: 0.61, liquidity: 651504137 },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { usdPrice: 0.42, priceChange24h: -2.1, liquidity: 121400000 },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { usdPrice: 0.9997, priceChange24h: 0.01, liquidity: 900000000 },
  DezXAZ8z7PnrnRJjz3VnWbD5XW7muX2o4f8tJYpPB263: { usdPrice: 0.000018, priceChange24h: 6.2, liquidity: 39000000 },
  EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLz9LmFddfVLT: { usdPrice: 0.71, priceChange24h: -4.9, liquidity: 82000000 },
  HZ1JovNiVvGrGNiiYvEozEVg6YhBQAa3kK1iYvSEyVtE: { usdPrice: 0.11, priceChange24h: 2.7, liquidity: 18000000 }
};

const state = { mode: "DCA", rows: [], threshold: 3 };

const ids = {
  apiStatus: document.querySelector("#apiStatus"),
  statusText: document.querySelector("#statusText"),
  refreshButton: document.querySelector("#refreshButton"),
  watchCount: document.querySelector("#watchCount"),
  tokenList: document.querySelector("#tokenList"),
  signalTable: document.querySelector("#signalTable"),
  threshold: document.querySelector("#threshold"),
  thresholdValue: document.querySelector("#thresholdValue"),
  avgMove: document.querySelector("#avgMove"),
  topSignal: document.querySelector("#topSignal"),
  liquidity: document.querySelector("#liquidity"),
  strategyTitle: document.querySelector("#strategyTitle"),
  strategyText: document.querySelector("#strategyText"),
  modeLabel: document.querySelector("#modeLabel"),
  apiTrace: document.querySelector("#apiTrace")
};

function money(value) {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(4)}`;
}
function compact(value) {
  if (!Number.isFinite(value)) return "--";
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
function pct(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
function anomalyScore(row) {
  const moveScore = Math.abs(row.priceChange24h || 0);
  const liquidityPenalty = row.liquidity > 0 ? Math.max(0, 1.4 - Math.log10(row.liquidity) / 10) : 1.2;
  return Number((moveScore * (1 + liquidityPenalty)).toFixed(2));
}
function actionIdea(row) {
  if (row.symbol === "USDC") return "Keep as route/base asset";
  if (row.score >= state.threshold && row.priceChange24h < 0) return state.mode === "DCA" ? "Increase DCA tranche" : "Stage buy trigger";
  if (row.score >= state.threshold && row.priceChange24h > 0) return state.mode === "Limit" ? "Stage take-profit trigger" : "Reduce entry size";
  return state.mode === "Observe" ? "Watch only" : "Normal cadence";
}
function setStatus(kind, text) {
  ids.apiStatus.className = `status-dot ${kind}`;
  ids.statusText.textContent = text;
}
function renderWatchlist() {
  ids.watchCount.textContent = String(TOKENS.length);
  ids.tokenList.innerHTML = TOKENS.map((token) => `
    <div class="token-item"><div class="token-icon">${token.symbol.slice(0, 2)}</div><div><strong>${token.symbol}</strong><span>${token.name}</span></div></div>
  `).join("");
}
function renderRows() {
  const rows = state.rows.map((row) => ({ ...row, idea: actionIdea(row) })).sort((a, b) => b.score - a.score);
  ids.signalTable.innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${row.symbol}</strong><br><span class="chip">${row.source}</span></td>
      <td>${money(row.usdPrice)}</td>
      <td class="${row.priceChange24h >= 0 ? "positive" : "negative"}">${pct(row.priceChange24h)}</td>
      <td>$${compact(row.liquidity)}</td>
      <td><span class="chip ${row.score >= state.threshold ? "hot" : "good"}">${row.score.toFixed(2)}</span></td>
      <td>${row.idea}</td>
    </tr>`).join("");
  const avgMove = rows.reduce((sum, row) => sum + Math.abs(row.priceChange24h || 0), 0) / rows.length;
  const top = rows[0];
  const totalLiquidity = rows.reduce((sum, row) => sum + (row.liquidity || 0), 0);
  ids.avgMove.textContent = pct(avgMove);
  ids.topSignal.textContent = top ? `${top.symbol} ${top.score.toFixed(1)}` : "--";
  ids.liquidity.textContent = `$${compact(totalLiquidity)}`;
  renderStrategy(rows);
}
function renderStrategy(rows) {
  const top = rows[0];
  ids.modeLabel.textContent = state.mode;
  if (!top) return;
  const direction = top.priceChange24h >= 0 ? "upside impulse" : "downside dislocation";
  ids.strategyTitle.textContent = `${top.symbol}: ${direction}`;
  const modeCopy = {
    DCA: `Treat ${top.symbol} as the current anomaly. If a user already has a target allocation, split the next DCA into smaller clips and only accelerate if liquidity remains healthy.`,
    Limit: `Use this as a trigger-order candidate. A positive spike suggests take-profit staging; a negative spike suggests a laddered buy trigger with strict size caps.`,
    Observe: `Do not route orders yet. Keep ${top.symbol} on a watch-only rail and wait for a second API sample before action.`
  };
  ids.strategyText.textContent = modeCopy[state.mode];
}
async function fetchPrices() {
  const mints = TOKENS.map((token) => token.mint).join(",");
  const url = `https://lite-api.jup.ag/price/v3?ids=${encodeURIComponent(mints)}`;
  ids.apiTrace.textContent = `GET ${url}\n\nFetching...`;
  setStatus("status-idle", "Fetching");
  try {
    const started = performance.now();
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const ms = Math.round(performance.now() - started);
    applyPriceData(data, "Jupiter live");
    setStatus("status-live", `Live ${ms}ms`);
    ids.apiTrace.textContent = `GET ${url}\n\nHTTP ${response.status} in ${ms}ms\n${JSON.stringify(data, null, 2).slice(0, 1800)}`;
  } catch (error) {
    await loadSnapshotFallback(url, error);
  }
}
async function loadSnapshotFallback(url, originalError) {
  try {
    const response = await fetch("./prices-snapshot.json", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`snapshot HTTP ${response.status}`);
    const data = await response.json();
    applyPriceData(data, "Jupiter snapshot");
    setStatus("status-error", "Snapshot fallback");
    ids.apiTrace.textContent = `GET ${url}\n\nLive browser request failed: ${originalError.message}\nLoaded prices-snapshot.json captured from Jupiter Price v3.\n\n${JSON.stringify(data, null, 2).slice(0, 1600)}`;
  } catch (snapshotError) {
    applyPriceData(SAMPLE, "Sample seed");
    setStatus("status-error", "Sample fallback");
    ids.apiTrace.textContent = `GET ${url}\n\nLive request failed: ${originalError.message}\nSnapshot fallback failed: ${snapshotError.message}\nLoaded labeled sample data so the strategy UI remains reviewable.`;
  }
}
function applyPriceData(data, sourceLabel = "Jupiter") {
  state.rows = TOKENS.map((token) => {
    const price = data[token.mint] || SAMPLE[token.mint] || {};
    const source = data[token.mint] ? sourceLabel : "Sample fill";
    const row = { ...token, source, usdPrice: Number(price.usdPrice), priceChange24h: Number(price.priceChange24h || 0), liquidity: Number(price.liquidity || 0) };
    row.score = anomalyScore(row);
    return row;
  });
  renderRows();
}
ids.refreshButton.addEventListener("click", fetchPrices);
ids.threshold.addEventListener("input", (event) => { state.threshold = Number(event.target.value); ids.thresholdValue.textContent = state.threshold.toFixed(1); renderRows(); });
document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    renderRows();
  });
});
renderWatchlist();
applyPriceData(SAMPLE, "Sample seed");
fetchPrices();
