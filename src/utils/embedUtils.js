const { EmbedBuilder } = require('discord.js');

function createEmbed(message, client) {
    return new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setDescription(message);
}

function noPlayerError(interaction, client) {
    return interaction.reply({
        embeds: [createEmbed(`${client.config.warnEmoji} There is no active player!`, client)],
        ephemeral: true
    });
}

module.exports = {
    createEmbed,
    noPlayerError
}; 