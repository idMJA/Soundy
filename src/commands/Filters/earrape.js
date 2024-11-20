const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('earrape')
        .setDescription('Toggles the earrape filter'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} There is no active player in this server.`)
                ],
                ephemeral: true
            });
        }

        // Set equalizer settings for earrape
        await player.filters.setEqualizer([
            { band: 0, gain: 0.25 },
            { band: 1, gain: 0.5 },
            { band: 2, gain: -0.5 },
            { band: 3, gain: -0.25 },
            { band: 4, gain: 0 },
            { band: 6, gain: -0.025 },
            { band: 7, gain: -0.0175 },
            { band: 8, gain: 0 },
            { band: 9, gain: 0 },
            { band: 10, gain: 0.0125 },
            { band: 11, gain: 0.025 },
            { band: 12, gain: 0.375 },
            { band: 13, gain: 0.125 },
            { band: 14, gain: 0.125 }
        ]);
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Earrape filter enabled`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 