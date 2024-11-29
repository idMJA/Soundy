const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearqueue')
        .setDescription('Clear the current music queue'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.reply({ content: 'There is no active player in this server.', ephemeral: true });
        }
        updateLastActivity(player.guild, 'Clear Queue', interaction.user);
        player.queue.clear();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription('The queue has been cleared.')
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    },
};