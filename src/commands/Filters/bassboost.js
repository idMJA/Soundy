const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bassboost')
        .setDescription('Adjust the bassboost level of the player'),
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

        // Apply the bassboost filter
        player.filters.bassBoost();
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Bassboost level set to: **${level}**`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};