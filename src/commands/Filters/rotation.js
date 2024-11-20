const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rotation')
        .setDescription('Enables the rotation filter'),
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

        // Enable rotation filter
        player.filters.setRotation({
            rotationHz: 0.2
        });
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Rotation filter enabled`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 