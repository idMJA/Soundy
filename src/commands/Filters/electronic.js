const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('electronic')
        .setDescription('Toggles the electronic filter'),
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

        // Set equalizer settings for electronic
        await player.filters.setEqualizer([
            { band: 0, gain: 0.375 },
            { band: 1, gain: 0.35 },
            { band: 2, gain: 0.125 },
            { band: 5, gain: -0.125 },
            { band: 6, gain: -0.125 },
            { band: 8, gain: 0.25 },
            { band: 9, gain: 0.125 },
            { band: 10, gain: 0.15 },
            { band: 11, gain: 0.2 },
            { band: 12, gain: 0.25 },
            { band: 13, gain: 0.35 },
            { band: 14, gain: 0.4 }
        ]);
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Electronic filter enabled`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 