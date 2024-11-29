const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Make the bot leave the voice channel'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.reply({ content: 'There is no active player in this server.', ephemeral: true });
        }

        player.destroy();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription('Left the voice channel and cleared the queue.')
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    },
};
