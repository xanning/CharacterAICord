const { Client } = require("discord.js-selfbot-v13");
const { CharacterAI } = require("node_characterai");

const client = new Client();
const characterAI = new CharacterAI();
const characterId = "xxxxxx"; // Replace with your character ID
const conversationId = "xxxxxx-xxxx-xxxx-xxxxx-xxxx"; // Replace with your conversation ID
let dmSession = null;

(async () => {
   // authenticate with Character.AI
    await characterAI.authenticate("Token [TOKEN]");
    console.log("Character.AI authenticated");

    // Create DM session 
    const character = await characterAI.fetchCharacter(characterId);
    dmSession = await character.DM(conversationId);

    // To keep alive you have to ping. There's no other choice afaik. Make sure to train your character to not reply to ping messages, or take them into context.
    // you could also delete the received message for ping and delete the ping message after sending it but idk how to do that
    setInterval(async () => {
        try {
            if (dmSession) {
                await dmSession.sendMessage("[ping]");
                console.log("Sent keep-alive ping to Character.AI");
            }
        } catch (err) {
            console.error("Keep-alive ping failed, recreating DM session...", err);
            try {
                const character = await characterAI.fetchCharacter(characterId);
                dmSession = await character.DM(conversationId);
                console.log("Reconnected DM session after ping fail");
            } catch (reErr) {
                console.error("Failed to reconnect DM session:", reErr);
            }
        }
    }, 10 * 60 * 1000); // every 10 min
})();

client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.id === client.user.id) return;
    // simple reply to mentions and await
    if (message.mentions.users.has(client.user.id)) {
        const userMessage = message.content.replace(`<@${client.user.id}>`, "").trim();
        if (!userMessage) return;

        try {
            if (!dmSession) {
                const character = await characterAI.fetchCharacter(characterId);
                dmSession = await character.DM(conversationId);
            }

            const reply = await dmSession.sendMessage(userMessage);
            await message.reply(reply.content+"\n-# \ℹ️");
        } catch (err) {
            console.error("Error sending message:", err);
            
        }
    }
});

client.login("[DISCORD_TOKEN]"); // Replace with your Discord token
