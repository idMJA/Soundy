const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('darthvader')
        .setDescription('Toggles the Darth Vader voice filter'),
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

        // Set the darthvader filter using timescale
        player.filters.setTimescale({
            speed: 0.975,
            pitch: 0.5,
            rate: 0.8
        });
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Darth Vader filter enabled`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 