
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "tradingview-mcp-jackson", "src", "server.js");

async function testQuote() {
  console.log("🚀 Testing Quote Get...");
  
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  try {
    await client.connect(transport);
    console.log("✅ MCP Connected.");

    console.log("📡 Calling quote_get...");
    const result = await client.callTool({
      name: "quote_get",
      arguments: {},
    });

    console.log("📊 Results:");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  } finally {
    process.exit(0);
  }
}

testQuote();
