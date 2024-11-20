const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pitch')
        .setDescription('Sets the pitch of the current track')
        .addNumberOption(option =>
            option.setName('value')
                .setDescription('The pitch value (0.5 to 2.0)')
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

        const pitchValue = interaction.options.getNumber('value');
        
        // Set the pitch using timescale filter
        player.filters.setTimescale({
            pitch: pitchValue,
            rate: 1.0,
            speed: 1.0
        });
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Pitch set to: **${pitchValue}x**`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 