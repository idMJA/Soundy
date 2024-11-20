const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speed')
        .setDescription('Changes the speed of the currently playing track')
        .addNumberOption(option =>
            option.setName('value')
                .setDescription('The speed value (0.5 to 2.0)')
                .setRequired(true)
                .setMinValue(0.5)
                .setMaxValue(2.0)),
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

        const speedValue = interaction.options.getNumber('value');
        
        // Set the speed using timescale filter
        player.filters.setTimescale({
            speed: speedValue,
            pitch: 1.0,
            rate: 1.0
        });
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Speed set to: **${speedValue}x**`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 