const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chipmunk')
        .setDescription('Toggles the chipmunk filter'),
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

        // Set timescale settings for chipmunk
        await player.filters.setTimescale({
            speed: 1.05,
            pitch: 1.35,
            rate: 1.25
        });
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Chipmunk filter enabled`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 