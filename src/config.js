const emoji = require('./config/emoji');
require('dotenv').config();

module.exports = {
    // BOT VERSION //
    botVersion: "3.1.0",
    // MUSIC CONFIG //
    searchPlatform: "spotify", // spotify, soundcloud, deezer, applemusic, youtube (patched from lavalink), youtube music (patched from lavalink)
    // BOT INFO //
    status: "idle", // idle, listening, watching, competing
    activityType: "Listening", // Listening, Watching, Competing, Playing
    eventListeners: 200, // amount of event listeners
    developers: ['885731228874051624', '932817217614118943'], // developer ids
    noPerms: `You **do not** have the required permissions to use this command!`,
    ownerOnlyCommand: `This command is **only** available for the owner of the bot!`,
    botInvite: "https://discord.com/oauth2/authorize?client_id=1260252174861074442&permissions=8&scope=bot%20applications.commands", // bot invite link
    botServerInvite: "https://discord.gg/pTbFUFdppU", // bot server invite
    banner: "https://i.ibb.co.com/z8c0SQK/bannersoundy-FHD.png", // banner url

    // EMBED COLORS //
    embedColor: "00ff33",
    embedYes: "Green",
    embedNo: "Red",
    
    // TOPGG //
    topggAuth: "anything", // anything as a password
    topggVoteLog: "1260482297355046913", // channel id
    topggPort: "20054", // your server port

    // CHANNEL IDS //
    slashCommandLoggingChannel: "1234567890123456789", // channel id for slash command logging
    suggestionChannel: "9876543210987654321", // channel id for suggestions 
    bugReportChannel: "1357924680123456789", // channel id for bug reports
    botLeaveChannel: "2468135790123456789", // channel id for bot leave
    botJoinChannel: "3691470258012345678", // channel id for bot join
    botUpdateChannel: "1234567890987654321", // channel id for bot updates

    ...emoji
};
