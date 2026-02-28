import axios from 'axios';
import { Supervisor } from './agents/supervisor.js';
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
// These should be set in your .env file
const BB_SERVER_URL = process.env.BLUEBUBBLES_URL || 'http://localhost:1234';
const BB_PASSWORD = process.env.BLUEBUBBLES_PASSWORD || 'your_password';
const PREFIX = '!avon';

console.log("🚀 Initializing iMessage (BlueBubbles) Client...");

/**
 * Sends a message back to the user via BlueBubbles
 */
async function sendIMessage(chatGuid, text) {
    try {
        await axios.post(`${BB_SERVER_URL}/api/v1/message/text`, {
            chatGuid: chatGuid,
            tempGuid: `temp-${Date.now()}`,
            message: text,
            method: "apple-script"
        }, {
            headers: { 'Authorization': `Bearer ${BB_PASSWORD}` }
        });
    } catch (error) {
        console.error("Failed to send iMessage:", error.response?.data || error.message);
    }
}

/**
 * Polls for new messages (Simple implementation)
 * Note: BlueBubbles also supports WebSockets for real-time, 
 * but polling is more robust for initial setup.
 */
let lastCheckTimestamp = Date.now();

async function pollMessages() {
    try {
        const response = await axios.get(`${BB_SERVER_URL}/api/v1/message`, {
            params: {
                limit: 10,
                after: lastCheckTimestamp,
                with_handle: true
            },
            headers: { 'Authorization': `Bearer ${BB_PASSWORD}` }
        });

        const messages = response.data.data || [];

        for (const msg of messages) {
            // Update timestamp so we don't process it again
            if (msg.dateCreated > lastCheckTimestamp) {
                lastCheckTimestamp = msg.dateCreated;
            }

            // Skip if it's from us or doesn't have the prefix
            if (msg.isFromMe || !msg.text?.startsWith(PREFIX)) continue;

            const goal = msg.text.slice(PREFIX.length).trim();
            const chatGuid = msg.chatGuid;

            if (!goal) {
                await sendIMessage(chatGuid, "🤖 Please specify a task for Avon.\nExample: `!avon build a dark mode login screen`");
                continue;
            }

            console.log(`\n[iMessage] Received Goal from ${msg.handle?.address}: ${goal}`);
            await sendIMessage(chatGuid, `🤖 Avon Bot received your goal. Initializing Swarm Supervisor...\n\nTask: ${goal}`);

            try {
                // Execute the task via Supervisor
                const result = await Supervisor.execute(goal);

                if (result.status === "success") {
                    await sendIMessage(chatGuid, `✅ *Avon Task Complete!*\n\nI have successfully executed the generation. You can view the artifacts on your Velocity Dashboard.`);
                } else {
                    await sendIMessage(chatGuid, `❌ *Avon Task Failed*\n\nThe Swarm encountered an error. Check local console logs.`);
                }
            } catch (error) {
                console.error("Supervisor Execution Error:", error);
                await sendIMessage(chatGuid, `⚠️ *Critical error*: ${error.message}`);
            }
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error("❌ Error: Could not connect to BlueBubbles server. Is it running?");
        } else {
            console.error("Polling error:", error.message);
        }
    }

    // Poll every 3 seconds
    setTimeout(pollMessages, 3000);
}

// Start polling
pollMessages();
console.log("✅ iMessage Bot is now listening for !avon commands via BlueBubbles.");
