const { ClusterClient, getInfo } = require('discord-hybrid-sharding');
const { Client, GatewayIntentBits, EmbedBuilder, Collection, Partials } = require('discord.js');
const fs = require('fs');
const config = require('./config.js');
const logs = require('./utils/logs.js');

const currentVersion = `${config.botVersion}`;

let client;
try {
    client = new Client({
        shards: getInfo().SHARD_LIST,
        shardCount: getInfo().TOTAL_SHARDS,
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.AutoModerationConfiguration,
            GatewayIntentBits.GuildScheduledEvents,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.AutoModerationExecution,
        ],
        partials: [
            Partials.GuildMember,
            Partials.Channel,
            Partials.GuildScheduledEvent,
            Partials.Message,
            Partials.Reaction,
            Partials.ThreadMember,
            Partials.User
        ],
    });
} catch (error) {
    logs.error(`Error while creating the client.`, error);
}

client.config = require('./config.js');
client.logs = logs;

// require('./events/Giveaway/handleGiveaway.js');
require('./functions/processHandlers.js')();

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const triggerFiles = fs.readdirSync("./src/triggers").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events");
const commandFolders = fs.readdirSync("./src/commands");

client.manager = require('./client.js')(client);

const playerEvents = require('./events/MusicEvents/playerEvents.js');

// Handle raw events for voice updates
client.on('raw', (d) => client.manager.updateVoiceState(d));

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleTriggers(triggerFiles, "./src/triggers");
    client.handleCommands(commandFolders, "./src/commands");
    playerEvents(client);
    
    // Initialize manager when client is ready
    client.once('ready', () => {
        client.manager.init(client.user.id);
        client.logs.success('Lavalink Manager initialized!');
    });
    
    client.login(process.env.TOKEN).catch((error) => {
        logs.error(`Error while logging in. Check if your token is correct or double check your also using the correct intents.`, error);
    });
})();
const color = {
    red: '\x1b[31m',
    orange: '\x1b[38;5;202m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    pink: '\x1b[38;5;213m',
    torquise: '\x1b[38;5;45m',
    purple: '\x1b[38;5;57m',
    reset: '\x1b[0m'
};

function getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

process.on('unhandledRejection', (reason, promise) => {
    logs.error(`Unhandled Rejection at:`, promise, `reason:`, reason);
});

process.on("uncaughtException", (err) => {
    logs.error(`Uncaught Exception:`, err);
});

client.cluster = new ClusterClient(client);

const { initializeVoteTracker } = require('./events/VoteEvents/vote.js');
initializeVoteTracker(client);

