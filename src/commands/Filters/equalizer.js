const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('equalizer')
        .setDescription('Sets custom equalizer bands')
        .addNumberOption(option =>
            option.setName('band')
                .setDescription('The band to adjust (0-13)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(13))
        .addNumberOption(option =>
            option.setName('gain')
                .setDescription('The gain value (-0.25 to 1.0)')
                .setRequired(true)
                .setMinValue(-0.25)
                .setMaxValue(1.0)),
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

        const band = interaction.options.getNumber('band');
        const gain = interaction.options.getNumber('gain');

        // Set the equalizer band
        await player.filters.setEqualizer([{ band, gain }]);
        
        // Update the filters
        await player.filters.updateFilters();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.yesEmoji} Set Band **${band}** to gain: **${gain}**`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
}; 