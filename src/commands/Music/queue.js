const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current music queue'),
    async execute(interaction, client) {
        await interaction.deferReply();

        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.followUp({ content: 'There is no active player in this server.', ephemeral: true });
        }

        const queue = player.queue;
        const currentTrack = player.queue.current;

        if (!currentTrack) {
            return interaction.followUp({ content: 'There are no tracks in the queue.', ephemeral: true });
        }

        const tracks = queue.map((track, i) => {
            return `${i + 1}. [${track.title}](${track.uri}) - ${track.requester}`;
        });

        const chunkedTracks = tracks.length > 10 ? tracks.slice(0, 10) : tracks;
        const remaining = tracks.length > 10 ? tracks.length - 10 : 0;

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Current Queue')
            .setDescription(`**Now Playing:**\n[${currentTrack.title}](${currentTrack.uri}) - ${currentTrack.requester}\n\n**Up Next:**\n${chunkedTracks.join('\n')}${remaining ? `\n\nand ${remaining} more...` : ''}`)
            .setFooter({ text: `Total tracks: ${tracks.length + 1}` });

        interaction.followUp({ embeds: [embed] });
    },
};
