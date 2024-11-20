const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getButtons(client) {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_shuffle')
                .setEmoji(client.config.shuffleEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_previous') 
                .setEmoji(client.config.previousEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_pauseplay')
                .setEmoji(client.config.playEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_skip')
                .setEmoji(client.config.skipEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_loop')
                .setEmoji(client.config.loopEmoji)
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_queue')
                .setEmoji(client.config.listEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_voldown')
                .setEmoji(client.config.volDownEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_clear')
                .setEmoji(client.config.trashEmoji)
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('setup_volup')
                .setEmoji(client.config.volUpEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_stop')
                .setEmoji(client.config.stopEmoji)
                .setStyle(ButtonStyle.Danger)
        );

    return [row1, row2];
}

module.exports = { getButtons };

