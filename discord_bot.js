import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { Supervisor } from './agents/supervisor.js';

// Load environment variables (such as DISCORD_TOKEN)
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

const PREFIX = '!avon'; // Trigger command
const AUTHORIZED_PHONE_NUMBER = '6098519526'; // For reference, if you want phone-level auth in WhatsApp/Discord bridges

client.once('ready', () => {
    console.log(`✅ Discord Avon Bot (formerly OpenClaw) is READY and logged in as ${client.user.tag}!`);
    client.user.setActivity('Velocity Swarm Operations', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
    // Ignore messages from bots (including ourselves)
    if (message.author.bot) return;

    // Check if message starts with our prefix
    if (message.content.startsWith(PREFIX)) {
        const goal = message.content.slice(PREFIX.length).trim();

        if (!goal) {
            await message.reply("Please specify a task for Avon.\nExample: `!avon build a sci-fi flutter app`");
            return;
        }

        console.log(`\n[Discord] Received Goal from user ${message.author.tag}: ${goal}`);

        // Let the user know we're starting the swarm
        const pendingMessage = await message.reply(`🤖 **Avon Bot received your goal.** Initializing the Velocity Swarm Supervisor...\n\nTask: *${goal}*\n\n(I will modify this message when the generation is complete).`);

        try {
            // Execute the Velocity Supervisor for scaffolding and generation
            const result = await Supervisor.execute(goal);

            if (result.status === "success") {
                await pendingMessage.edit(`✅ **Avon Supervisor Task Complete!**\n\nThe software factory swarm has executed your generation locally. You can view the artifacts in your local environment.`);
            } else {
                await pendingMessage.edit(`❌ **Avon Supervisor Task Failed**\n\nThe Swarm exceeded maximum retries. Check local terminal logs for errors.`);
            }
        } catch (error) {
            console.error("Discord Request Error:", error);
            await pendingMessage.edit(`⚠️ **Avon encountered a critical swarm error**:\n\`\`\`${error.message}\`\`\``);
        }
    }
});

// Start the Discord Client
if (!process.env.DISCORD_TOKEN) {
    console.error("❌ MISSING DISCORD_TOKEN: Please set DISCORD_TOKEN in a .env file located at the root of the project.");
    process.exit(1);
} else {
    client.login(process.env.DISCORD_TOKEN);
}
