const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player || !player.queue.length) {
            return interaction.reply({ content: 'There are no tracks in the queue to shuffle.', ephemeral: true });
        }

        player.queue.shuffle();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription('The queue has been shuffled.')
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    },
};
