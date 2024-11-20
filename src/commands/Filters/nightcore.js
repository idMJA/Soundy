const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nightcore')
        .setDescription('Toggles the nightcore filter for the current track'),
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

        // Toggle nightcore filter (increases pitch and speed)
        player.filters.nightcore();
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Nightcore filter ${player.filters.nightcore() ? 'enabled' : 'disabled'}`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 