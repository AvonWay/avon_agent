import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

async function deploy() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./tradingview-mcp-jackson/src/server.js"],
  });

  const client = new Client({ name: "final", version: "1.0.0" }, { capabilities: { tools: {} } });
  await client.connect(transport);

  const pine = fs.readFileSync("./ross-cameron-momentum.pine", "utf-8");

  // Step 1: Open Pine Editor
  console.log("1. Opening Pine Editor...");
  await client.callTool({ name: "ui_open_panel", arguments: { panel: "pine-editor", action: "open" } });
  await new Promise(r => setTimeout(r, 2000));

  // Step 2: Set source
  console.log("2. Injecting code...");
  const inj = await client.callTool({ name: "pine_set_source", arguments: { source: pine } });
  console.log("   " + JSON.parse(inj.content[0].text).success);
  await new Promise(r => setTimeout(r, 1000));

  // Step 3: Use ui_evaluate to click the correct compile+add button
  // In TradingView, the "Add to chart" button has specific CSS classes
  console.log("3. Clicking compile via DOM...");
  const compileResult = await client.callTool({
    name: "ui_evaluate",
    arguments: {
      expression: [
        "(function() {",
        "  // Find the Pine Editor toolbar buttons",
        "  var toolbar = document.querySelector('[class*=\"pineEditorToolbar\"], [data-name=\"pine-editor-toolbar\"], [class*=\"toolbar\"]');",
        "  var allBtns = document.querySelectorAll('button');",
        "  var pineButtons = [];",
        "  for (var i = 0; i < allBtns.length; i++) {",
        "    var b = allBtns[i];",
        "    if (!b.offsetParent) continue;",
        "    var t = (b.textContent || '').trim();",
        "    var dn = b.getAttribute('data-name') || '';",
        "    var title = b.getAttribute('title') || '';",
        "    var ariaLabel = b.getAttribute('aria-label') || '';",
        "    // Collect Pine-related buttons",
        "    if (t.match(/save|add|compile|apply|chart/i) || dn.match(/save|add|compile|apply|chart/i) || title.match(/save|add|compile|apply|chart/i)) {",
        "      pineButtons.push({text: t.substring(0,40), dn: dn, title: title.substring(0,40), aria: ariaLabel.substring(0,40), y: Math.round(b.getBoundingClientRect().y)});",
        "    }",
        "  }",
        "  return {pineButtons: pineButtons};",
        "})()",
      ].join("\n")
    }
  });
  const compData = JSON.parse(compileResult.content[0].text);
  console.log("   Found buttons:", JSON.stringify(compData.result, null, 2));

  // Step 4: Try using the TradingView API to programmatically add the study
  console.log("4. Using TradingView API to add study...");
  const apiResult = await client.callTool({
    name: "ui_evaluate",
    arguments: {
      expression: [
        "(function() {",
        "  try {",
        "    // Try to find and click the pine editor 'Add to chart' or 'Save and add' button",
        "    var btns = document.querySelectorAll('button');",
        "    for (var i = 0; i < btns.length; i++) {",
        "      var dn = btns[i].getAttribute('data-name') || '';",
        "      if (dn === 'save-and-add-to-chart' || dn === 'add-to-chart') {",
        "        btns[i].click();",
        "        return {success: true, method: 'data-name', clicked: dn};",
        "      }",
        "    }",
        "    // Try Publish button area - sometimes 'Add to chart' is near it",
        "    var saveBtn = null;",
        "    for (var j = 0; j < btns.length; j++) {",
        "      var t = btns[j].textContent.trim();",
        "      if (t === 'SaveSave' || t === 'Save') {",
        "        saveBtn = btns[j];",
        "        break;",
        "      }",
        "    }",
        "    if (saveBtn) {",
        "      saveBtn.click();",
        "      return {success: true, method: 'save-button', note: 'Clicked Save - Add to chart should appear next'};",
        "    }",
        "    return {success: false, error: 'No save/add button found'};",
        "  } catch(e) { return {success: false, error: e.message}; }",
        "})()",
      ].join("\n")
    }
  });
  const apiData = JSON.parse(apiResult.content[0].text);
  console.log("   " + JSON.stringify(apiData.result, null, 2));

  await new Promise(r => setTimeout(r, 3000));

  // Step 5: Now look for "Add to chart" again after saving
  console.log("5. Looking for 'Add to chart' after save...");
  const addResult = await client.callTool({
    name: "ui_evaluate",
    arguments: {
      expression: [
        "(function() {",
        "  var btns = document.querySelectorAll('button');",
        "  for (var i = 0; i < btns.length; i++) {",
        "    if (!btns[i].offsetParent) continue;",
        "    var t = btns[i].textContent.trim().toLowerCase();",
        "    if (t.indexOf('add to chart') !== -1) {",
        "      btns[i].click();",
        "      return {success: true, clicked: btns[i].textContent.trim()};",
        "    }",
        "  }",
        "  // List what we can see",
        "  var visible = [];",
        "  for (var j = 0; j < btns.length; j++) {",
        "    if (!btns[j].offsetParent) continue;",
        "    var text = btns[j].textContent.trim();",
        "    if (text && btns[j].getBoundingClientRect().y > 400 && btns[j].getBoundingClientRect().y < 650) {",
        "      visible.push(text.substring(0,40));",
        "    }",
        "  }",
        "  return {success: false, pine_editor_buttons: visible};",
        "})()",
      ].join("\n")
    }
  });
  const addData = JSON.parse(addResult.content[0].text);
  console.log("   " + JSON.stringify(addData.result, null, 2));

  // Final state
  console.log("6. Final chart state:");
  const state = await client.callTool({ name: "chart_get_state", arguments: {} });
  console.log(JSON.stringify(JSON.parse(state.content[0].text), null, 2));

  process.exit(0);
}

deploy().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
