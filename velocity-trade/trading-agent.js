import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Ollama } from "ollama";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "tradingview-mcp-jackson", "src", "server.js");
const STRATEGIES = {
  ross: {
    name: "Ross Cameron Momentum",
    file: "ross-cameron-momentum.pine",
    rules: "- Stocks gapping 5%+ premarket on news/catalyst\n- High relative volume (2x+ average)\n- Bull Flag: strong pole, tight consolidation, breakout above flag\n- Flat Top Breakout: resistance tested 2+ times then breaks\n- Only trade first 90 minutes of market open\n- 2:1 minimum R:R ratio\n- VWAP = key support/resistance level\n- Above 9 EMA = bullish momentum"
  },
  crypto: {
    name: "Crypto SuperTrend + EMA",
    file: "strategy-crypto-supertrend.pine",
    rules: "- Trend following for Bitcoin/Crypto assets\n- Buy when price crosses above the SuperTrend line AND is above the 200 EMA\n- Sell when price drops below SuperTrend AND is below the 200 EMA\n- The 200 EMA filters out chop in ranging markets\n- Risk/Reward varies, but trailing stop is the SuperTrend line itself"
  },
  forex: {
    name: "Forex BB + RSI Mean Reversion",
    file: "strategy-forex-bollinger.pine",
    rules: "- Scalping/Mean Reversion for Forex pairs in ranging markets\n- Go Long when price drops below the Lower Bollinger Band AND RSI is < 30 (oversold)\n- Go Short when price spikes above Upper Bollinger Band AND RSI is > 70 (overbought)\n- Exit rule: Take profit when price returns to the Middle Bollinger Band (mean)\n- Strict tight stops required for scalping"
  },
  funds: {
    name: "Mutual Funds Golden Cross",
    file: "strategy-funds-goldencross.pine",
    rules: "- Very long-term strategy for Index ETFs/Mutual Funds (SPY, QQQ, etc)\n- Golden Cross: Buy when the 50 SMA crosses above the 200 SMA (Bull Market transition)\n- Death Cross: Sell/Move to cash when the 50 SMA crosses below the 200 SMA (Bear Market transition)\n- Requires high patience; used on Daily or Weekly timeframes"
  },
  squeeze: {
    name: "Options Volatility Squeeze Breakout",
    file: "strategy-macd-squeeze.pine",
    rules: "- Identifies explosive breakouts after low volatility\n- Squeeze ON: Bollinger Bands squeeze completely inside the Keltner Channels\n- Squeeze OFF (Fire): Bollinger Bands expand outside the Keltner Channels\n- Trade direction: If MACD/Momentum histogram is > 0, go Long. If < 0, go Short\n- Perfect for Options straddles/strangles or directional swings"
  }
};

let activeStrategyKey = "ross";  // default strategy

const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

// ══════════════════════════════════════════════════════════════════════════════
// MCP CLIENT
// ══════════════════════════════════════════════════════════════════════════════
let mcpClient = null;

async function initMCP() {
  console.log("\n🚀 Starting Trading Agent...");
  console.log("─".repeat(60));

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  mcpClient = new Client(
    { name: "trading-agent", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  await mcpClient.connect(transport);
  const { tools } = await mcpClient.listTools();
  console.log(`✅ Connected to TradingView MCP Server`);
  console.log(`📡 Discovered ${tools.length} trading tools.`);
  console.log("─".repeat(60));
}

async function callTool(name, args = {}) {
  try {
    const result = await mcpClient.callTool({ name, arguments: args });
    const text = result.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return { error: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE CHART DATA — fetched automatically before every AI response
// ══════════════════════════════════════════════════════════════════════════════
async function getLiveContext() {
  const [health, chartState, uiState] = await Promise.all([
    callTool("tv_health_check"),
    callTool("chart_get_state"),
    callTool("tv_ui_state"),
  ]);

  if (!health?.success || !chartState?.success) {
    return `⚠️ TradingView connection lost. health=${JSON.stringify(health)}`;
  }

  const symbol   = chartState.symbol  || "unknown";
  const tf       = chartState.resolution || "unknown";
  const studies  = (chartState.studies || []).map(s => s.name).join(", ") || "none";
  const apiOk    = health.api_available;

  // Try to get live quote + indicator values
  let ohlcv = "";
  let indicators = "";
  if (apiOk) {
    const quote = await callTool("quote_get", {});
    if (quote?.success && quote.data) {
      const q = quote.data;
      ohlcv = `\nPrice: $${q.close || q.last_price || "?"} | O:${q.open} H:${q.high} L:${q.low} | Vol:${q.volume}`;
    }
    const studies = await callTool("data_get_study_values");
    if (studies?.success && studies.studies) {
      let vals = [];
      for (let i = 0; i < Math.min(studies.studies.length, 5); i++) {
        const s = studies.studies[i];
        if (s.name.includes("Volume")) continue;
        vals.push(`${s.name}: ${JSON.stringify(s.values)}`);
      }
      if (vals.length > 0) indicators = `\nStudy Values: ${vals.join(" | ")}`;
    }
  }

  // UI panels
  const pineOpen  = uiState?.pine_editor?.open ? "YES" : "NO";
  const stratOpen = uiState?.strategy_tester?.open ? "YES" : "NO";

  return `
=== LIVE TRADINGVIEW DATA ===
Symbol     : ${symbol}
Timeframe  : ${tf}
Indicators : ${studies}${ohlcv}${indicators}
Pine Editor: ${pineOpen} | Strategy Tester: ${stratOpen}
API Ready  : ${apiOk}
=============================`;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMAND ROUTER — maps plain-English requests to actual tool calls
// ══════════════════════════════════════════════════════════════════════════════
async function routeCommand(input) {
  const lower = input.toLowerCase();

  // Change symbol
  const symbolMatch = input.match(/(?:load|go to|switch to|chart|check)\s+([A-Z]{1,5})\b/i);
  if (symbolMatch) {
    const sym = symbolMatch[1].toUpperCase();
    console.log(`   📊 Changing symbol to ${sym}...`);
    const r = await callTool("chart_set_symbol", { symbol: sym });
    return r?.success ? `✅ Switched to ${sym}` : `❌ Could not switch: ${r?.error}`;
  }

  // Change timeframe
  const tfMatch = input.match(/(?:set|change|switch to|use)\s+(1m|5m|15m|30m|1h|4h|1d|1w)/i);
  if (tfMatch) {
    const tf = tfMatch[1].toUpperCase().replace("M","").replace("H","60");
    console.log(`   ⏱️  Setting timeframe to ${tfMatch[1]}...`);
    const r = await callTool("chart_set_resolution", { resolution: tfMatch[1] });
    return r?.success ? `✅ Timeframe set to ${tfMatch[1]}` : `❌ Could not set timeframe: ${r?.error}`;
  }

  // Change / Load Strategy
  if (lower.includes("strategy") || lower.includes("pine") || lower.includes("script")) {
    let newKey = activeStrategyKey;
    if (lower.includes("ross") || lower.includes("momentum")) newKey = "ross";
    else if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("btc")) newKey = "crypto";
    else if (lower.includes("forex") || lower.includes("bollinger")) newKey = "forex";
    else if (lower.includes("fund") || lower.includes("mutual") || lower.includes("golden cross") || lower.includes("etf")) newKey = "funds";
    else if (lower.includes("squeeze") || lower.includes("options") || lower.includes("volatility")) newKey = "squeeze";
    
    if (newKey !== activeStrategyKey) {
      activeStrategyKey = newKey;
      console.log(`   🔁 Switched active strategy context to: ${STRATEGIES[activeStrategyKey].name}`);
    }

    if (lower.includes("load") || lower.includes("switch")) {
      console.log(`   🌲 Deploying ${STRATEGIES[activeStrategyKey].name} to TradingView...`);
      const pine = fs.readFileSync(path.join(__dirname, STRATEGIES[activeStrategyKey].file), "utf-8");
      
      // Attempt 1: Standard MCP tool
      let r = await callTool("ui_open_panel", { panel: "pine-editor", action: "open" });
      
      // Attempt 2: Force it open with JS if UI click fails
      if (!r || r.error) {
        console.log(`   ⚠️ Retrying Pine Editor launch...`);
        await callTool("ui_evaluate", {
          expression: "document.querySelector('[data-name=\"pine-editor\"]').click();"
        });
      }

      const inj = await callTool("pine_set_source", { source: pine });
      if (inj?.success) {
        await callTool("pine_smart_compile", {});
        return `✅ ${STRATEGIES[activeStrategyKey].name} deployed to your chart. AI rules updated!`;
      }
      return `❌ Failed to load strategy. Error: ${inj?.error || "Unknown"}`;
    }
    
    // Just a switch without explicitly asking to 'load' it to the chart
    if (lower.includes("switch")) {
         return `✅ AI is now analyzing using the rules for: ${STRATEGIES[activeStrategyKey].name}. (Type "load strategy" to push it to the chart).`;
    }
  }

  // Open strategy tester
  if (lower.includes("backtest") || lower.includes("strategy tester") || lower.includes("results")) {
    console.log("   📊 Opening Strategy Tester...");
    const r = await callTool("ui_open_panel", { panel: "backtesting", action: "open" });
    return r?.success ? "✅ Strategy Tester opened. Check bottom panel in TradingView." : `❌ ${r?.error}`;
  }

  // Screenshot
  if (lower.includes("screenshot") || lower.includes("show chart") || lower.includes("what does it look like")) {
    console.log("   📸 Capturing chart...");
    const r = await callTool("capture_screenshot", { region: "chart" });
    return r ? "📸 Screenshot captured." : "❌ Could not capture screenshot.";
  }

  // Health check
  if (lower.includes("health") || lower.includes("connection") || lower.includes("connected")) {
    const r = await callTool("tv_health_check");
    if (r?.success) {
      return `✅ Connected!\nSymbol: ${r.chart_symbol}\nTimeframe: ${r.chart_resolution}\nAPI: ${r.api_available ? "ready" : "limited"}`;
    }
    return `❌ Not connected: ${r?.error}`;
  }

  // Sentiment / indicators
  if (lower.includes("sentiment") || lower.includes("indicator") || lower.includes("trend") || lower.includes("analysis") || lower.includes("setup")) {
    const [quote, studies, state] = await Promise.all([
      callTool("quote_get", {}),
      callTool("data_get_study_values"),
      callTool("chart_get_state"),
    ]);
    let out = `📊 ${state?.symbol || "Chart"} Live Analysis:`;
    if (quote?.success && quote.data) {
      const q = quote.data;
      const price = q.close || q.last_price || "?";
      const bullish = q.close > q.open;
      out += `\nPrice: $${price} | O:${q.open} H:${q.high} L:${q.low}`;
      out += `\nCandle: ${bullish ? "🟢 Bullish" : "🔴 Bearish"}`;
      out += `\nVolume: ${q.volume}`;
    }
    if (studies?.success && studies.studies) {
      out += `\nIndicator Values:`;
      for (let i = 0; i < Math.min(studies.studies.length, 6); i++) {
        const s = studies.studies[i];
        if (s.name.includes("Volume")) continue;
        out += `\n  ${s.name}: ${JSON.stringify(s.values).substring(0, 80)}`;
      }
    }
    return out;
  }

  // Not a direct command — pass to AI with live context
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// AI CHAT — used when no direct command matched
// ══════════════════════════════════════════════════════════════════════════════
let conversationHistory = [];

async function aiChat(userInput, liveContext) {
  const activeStrategy = STRATEGIES[activeStrategyKey];
  
  const SYSTEM_PROMPT = `You are a professional day trading assistant analyzing the market using the following strategy: ${activeStrategy.name}.

LIVE MARKET DATA (just fetched):
${liveContext}

Your job:
- Analyse the live data above and give DIRECT, SPECIFIC trading advice based ONLY on the current strategy's rules.
- Give exact entry price, stop loss, and take profit levels if applicable.
- State risk:reward ratio clearly.
- If no setup meets criteria, say "NO TRADE" clearly.

ACTIVE STRATEGY RULES (${activeStrategy.name}):
${activeStrategy.rules}

IMPORTANT: Give DIRECT answers. Do not describe what you would do. Just do it in words.`;

  conversationHistory.push({ role: "user", content: userInput });

  const response = await ollama.chat({
    model: "llama3.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
    ],
  });

  conversationHistory.push(response.message);
  return response.message.content;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CHAT LOOP
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  await initMCP();

  // Auto-load live data on startup
  process.stdout.write("\n📡 Fetching live chart data...");
  const startupCtx = await getLiveContext();
  console.log(" done!\n");
  console.log(startupCtx);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  📈 VELOCITY TRADE AGENT v3`);
  console.log(`  Current Strategy: ${STRATEGIES[activeStrategyKey].name}`);
  console.log(`  💬 Commands: load crypto strategy | switch to forex | check AAPL | 5m | backtest`);
  console.log(`  💬 Or just ask anything about the chart`);
  console.log(`  🛑 Type "exit" to quit | "pine" to view script`);
  console.log(`${"═".repeat(60)}\n`);

  const prompt = () => {
    rl.question("👤 You: ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) { prompt(); return; }

      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log("\n🛑 Session ended. Stay disciplined! 💪\n");
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === "pine") {
        console.log("\n" + fs.readFileSync(path.join(__dirname, STRATEGIES[activeStrategyKey].file), "utf-8") + "\n");
        prompt();
        return;
      }

      console.log("\n🤖 Thinking...");

      try {
        // 1. Try direct command routing first (fast + reliable)
        const directResult = await routeCommand(trimmed);

        if (directResult) {
          console.log(`\n🤖 Agent: ${directResult}\n`);
        } else {
          // 2. Fetch fresh live data and ask AI
          const ctx = await getLiveContext();
          const reply = await aiChat(trimmed, ctx);
          console.log(`\n🤖 Agent: ${reply}\n`);
        }
      } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
