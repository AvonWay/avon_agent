import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function addToChart() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./tradingview-mcp-jackson/src/server.js"],
  });

  const client = new Client({ name: "adder", version: "1.0.0" }, { capabilities: { tools: {} } });
  await client.connect(transport);

  // Use ui_evaluate to click the "Add to chart" button directly via JS
  console.log("Clicking 'Add to chart' button...");
  const result = await client.callTool({
    name: "ui_evaluate",
    arguments: {
      expression: `
        (function() {
          var buttons = document.querySelectorAll('button');
          for (var i = 0; i < buttons.length; i++) {
            var text = buttons[i].textContent.trim().toLowerCase();
            if (text.includes('add to chart')) {
              buttons[i].click();
              return { success: true, clicked: buttons[i].textContent.trim() };
            }
          }
          return { success: false, error: 'Add to chart button not found' };
        })()
      `
    }
  });
  console.log(JSON.stringify(JSON.parse(result.content[0].text), null, 2));

  // Wait for the strategy to load
  await new Promise(r => setTimeout(r, 3000));

  // Get chart state to confirm
  console.log("Checking chart state...");
  const state = await client.callTool({ name: "chart_get_state", arguments: {} });
  console.log(JSON.stringify(JSON.parse(state.content[0].text), null, 2));

  process.exit(0);
}

addToChart().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
