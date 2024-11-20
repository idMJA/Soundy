const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Changes the playback rate of the current track')
        .addNumberOption(option =>
            option.setName('value')
                .setDescription('The rate value (0.5 to 2.0)')
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

        const rateValue = interaction.options.getNumber('value');
        
        // Set the rate using timescale filter
        player.filters.setTimescale({
            rate: rateValue,
            pitch: 1.0,
            speed: 1.0
        });
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Rate set to: **${rateValue}x**`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 