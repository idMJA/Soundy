const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),
    async execute(interaction, client) {
        await interaction.deferReply();

        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.followUp({ content: 'There is no active player in this server.', ephemeral: true });
        }

        const currentTrack = player.queue.current;
        if (!currentTrack) {
            return interaction.followUp({ content: 'There is no track currently playing.', ephemeral: true });
        }

        player.stop();

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`Skipped: **${currentTrack.title}**`)
            .setTimestamp();

        return interaction.followUp({ embeds: [embed] });
    },
};
