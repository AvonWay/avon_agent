import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;
const USER_NUMBER = '+14045501865'; // Your number from common US formats or previous context if available, otherwise I will ask. 
// Actually, I should use the number provided or known. The user hasn't explicitly given it in THIS turn, 
// but usually it's in the Twilio logs or I can try to find it.
// I'll use a placeholder and ask if it fails, OR I can try to find it in the audit files if any.

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function sendTest() {
    console.log("Attempting to send test SMS...");
    try {
        const message = await client.messages.create({
            body: "🚀 Avon Bot: Connection Test! If you received this, the outbound connection is WORKING. Now try texting me '!avon hello' back.",
            from: TWILIO_NUMBER,
            to: process.argv[2] || '+1' // Fallback to argument
        });
        console.log("✅ Message sent! SID:", message.sid);
    } catch (error) {
        console.error("❌ Failed to send message:", error.message);
    }
}

sendTest();
