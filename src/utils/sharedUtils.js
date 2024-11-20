const platformIcons = {
    youtube: 'https://i.imgur.com/xzVHhFY.png',
    spotify: 'https://i.imgur.com/qvdqtsc.png',
    soundcloud: 'https://i.imgur.com/MVnJ7mj.png',
    applemusic: 'https://i.imgur.com/Wi0oyYm.png',
    deezer: 'https://i.imgur.com/xyZ43FG.png',
    tidal: 'https://i.imgur.com/kPqy5V0.png',
    jiosaavn: 'https://i.imgur.com/N9Nt80h.png',
    default: 'https://thumbs2.imgbox.com/4f/9c/adRv6TPw_t.png'
};

// Import required dependencies
const { EmbedBuilder } = require('discord.js');
const { updateVoiceStatus } = require('./voiceStatus');


// Export playerMessages so it can be used across files
const playerMessages = new Map();
const lastActivity = new Map();

// Track inactivity for each guild
const inactivityTimers = new Map();

function formatTime(duration) {
    if (!duration || isNaN(duration)) return '00:00';
    
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor(duration / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));

    return parts.join(':');
}

function updateLastActivity(guildId, activity, user) {
    const requester = typeof user === 'object' ? user.tag : user;
    
    lastActivity.set(guildId, {
        action: activity,
        timestamp: new Date(),
        requester: requester
    });
}

function getLastActivity(guildId) {
    const activity = lastActivity.get(guildId);
    if (!activity) return 'No recent activity';

    const requesterText = activity.requester ? `by ${activity.requester}` : '';
    return `${activity.action} ${requesterText}`;
}

function getNodeInfo(player) {
    if (!player || !player.node) return 'Unknown';
    return player.node.options.identifier || 'Unknown';
}

function deleteNowPlayingEmbed(player) {
    const message = playerMessages.get(player.guild);
    if (message) {
        message.delete().catch(() => {});
        playerMessages.delete(player.guild);
    }
}

async function handleInactivity(client, player) {
    if (!player || !player.voiceChannel) return;

    const voiceChannel = client.channels.cache.get(player.voiceChannel);
    if (!voiceChannel) return;

    // Count members in voice channel (excluding bots)
    const members = voiceChannel.members.filter(member => !member.user.bot).size;

    // If no members or player is idle
    if (members === 0 || (!player.playing && !player.paused)) {
        if (!inactivityTimers.has(player.guild)) {
            inactivityTimers.set(player.guild, setTimeout(async () => {

                // Send leave message
                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.leaveEmoji} Left the voice channel due to inactivity.`)
                    .setTimestamp();
                
                client.channels.cache.get(player.textChannel)?.send({
                    embeds: [embed],
                    flags: 4096
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                // Clear voice status and destroy player
                await updateVoiceStatus(client, player, null);
                if (playerMessages.has(player.guild)) {
                    deleteNowPlayingEmbed(player);
                }
                await player.destroy();
                inactivityTimers.delete(player.guild);
            }, 60000)); // 1 minute timeout
        }
    } else {
        // Clear timer if there's activity
        clearInactivityTimer(player.guild);
    }
}

function clearInactivityTimer(guildId) {
    if (inactivityTimers.has(guildId)) {
        clearTimeout(inactivityTimers.get(guildId));
        inactivityTimers.delete(guildId);
    }
}

async function handleBotAlone(client, player) {
    if (!player || !player.voiceChannel) return;

    const voiceChannel = client.channels.cache.get(player.voiceChannel);
    if (!voiceChannel) return;

    // Count members in voice channel (excluding bots)
    const members = voiceChannel.members.filter(member => !member.user.bot).size;

    // If no human members in the channel
    if (members === 0) {
        const setupData = await SetupSchema.findOne({ 
            guildId: player.guild
        });

        if (setupData) {
            await updateSetupMessage(client, player);
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.leaveEmoji} Left the voice channel because I was alone.`)
            .setTimestamp();
        
        client.channels.cache.get(player.textChannel)?.send({
            embeds: [embed],
            flags: 4096
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

        await updateVoiceStatus(client, player, null);
        deleteNowPlayingEmbed(player);
        await player.destroy();
    }
}

module.exports = {
    platformIcons,
    formatTime,
    deleteNowPlayingEmbed,
    playerMessages,
    updateLastActivity,
    getLastActivity,
    getNodeInfo,
    handleInactivity,
    clearInactivityTimer,
    handleBotAlone
}; 