const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8d')
        .setDescription('Toggles the 8D audio filter'),
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

        // Toggle 8D filter
        player.filters.eightD(!player.filters.eightD());
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} 8D filter ${player.filters.eightD() ? 'enabled' : 'disabled'}`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};