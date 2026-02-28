import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { Supervisor } from './agents/supervisor.js';

// Configuration
const WHATSAPP_PREFIX = '!avon'; // Command prefix to trigger the Avon Bot

console.log("Initializing WhatsApp Client...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log("QR Code received. Please scan with your WhatsApp App to link Avon Bot:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Avon Bot is READY and fully connected!');
});

client.on('message_create', async (message) => {
    // Prevent the bot from replying to itself recursively unless specifically meant to
    if (message.fromMe && !message.body.startsWith(WHATSAPP_PREFIX)) {
        return;
    }

    if (message.body.startsWith(WHATSAPP_PREFIX)) {
        const goal = message.body.slice(WHATSAPP_PREFIX.length).trim();

        if (!goal) {
            await message.reply("Please specify a task for Avon.\nExample: `!avon build a dark mode login screen in react`");
            return;
        }

        console.log(`\n[WhatsApp] Received Goal from ${message.from}: ${goal}`);
        await message.reply(`🤖 Avon Bot received your goal. Initializing Swarm Supervisor...\n\nTask: *${goal}*\n\n(I will notify you when it completes).`);

        try {
            // Send the request to the Velocity Supervisor
            const result = await Supervisor.execute(goal);

            if (result.status === "success") {
                await message.reply(`✅ *Avon Supervisor Task Complete!*\n\nI have successfully executed the generation. You can view the artifacts locally on your Velocity Environment.`);
            } else {
                await message.reply(`❌ *Avon Supervisor Task Failed*\n\nThe Swarm exceeded maximum retries or encountered an error. Check local console logs for details.`);
            }
        } catch (error) {
            console.error("WhatsApp Request Error:", error);
            await message.reply(`⚠️ *Avon encountered a critical error*:\n${error.message}`);
        }
    }
});

client.initialize();
