import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import { Supervisor } from './agents/supervisor.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const { MessagingResponse } = twilio.twiml;

// --- Configuration ---
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;
const PREFIX = '!avon';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

console.log("🚀 Initializing Twilio (SMS) Bot...");

app.post('/webhook', async (req, res) => {
    const incomingMsg = req.body.Body;
    const fromNumber = req.body.From;
    const twiml = new MessagingResponse();

    console.log(`\n[Twilio] Received message from ${fromNumber}: ${incomingMsg}`);

    if (incomingMsg.startsWith(PREFIX)) {
        const goal = incomingMsg.slice(PREFIX.length).trim();

        if (!goal) {
            twiml.message("🤖 Please specify a task for Avon.\nExample: `!avon build a dark mode login screen`");
            return res.type('text/xml').send(twiml.toString());
        }

        // Notify user immediately
        // We do this by sending an async reply because Supervisor.execute might take time
        // and Twilio webhooks have a 15s timeout
        try {
            await client.messages.create({
                body: `🤖 Avon Bot received your goal. Initializing Swarm Supervisor...\n\nTask: ${goal}`,
                from: TWILIO_NUMBER,
                to: fromNumber
            });

            // Execute the task via Supervisor
            // We run this in the background to avoid timing out the webhook
            (async () => {
                try {
                    const result = await Supervisor.execute(goal);

                    let finalBody = "";
                    if (result.status === "success") {
                        finalBody = `✅ *Avon Task Complete!*\n\nI have successfully executed the generation. You can view the artifacts on your Velocity Dashboard.`;
                    } else {
                        finalBody = `❌ *Avon Task Failed*\n\nThe Swarm encountered an error. Check local console logs.`;
                    }

                    await client.messages.create({
                        body: finalBody,
                        from: TWILIO_NUMBER,
                        to: fromNumber
                    });
                } catch (error) {
                    console.error("Supervisor Execution Error:", error);
                    await client.messages.create({
                        body: `⚠️ *Critical error*: ${error.message}`,
                        from: TWILIO_NUMBER,
                        to: fromNumber
                    });
                }
            })();

            // Respond to webhook to close it
            twiml.message("Processing...");
        } catch (error) {
            console.error("Twilio Send Error:", error);
            twiml.message(`⚠️ Error initializing task: ${error.message}`);
        }
    } else {
        // Just ignore if it doesn't start with prefix
        return res.sendStatus(200);
    }

    res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.TWILIO_PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Twilio (SMS) Bot is running on port ${PORT}`);
    console.log(`🔗 Point your Twilio Webhook URL to your public URL + /webhook`);
});
