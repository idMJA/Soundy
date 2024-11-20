const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Playlist = require('../../schemas/playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List your playlists or songs in a playlist')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('The name of the playlist (optional)')
                .setRequired(false)),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const playlistName = interaction.options.getString('playlist');

        try {
            if (!playlistName) {
                const playlists = await Playlist.find({ userId });
                const embed = new EmbedBuilder()
                    .setTitle('Your Playlists')
                    .setDescription(playlists.map(p => p.name).join('\n') || 'No playlists found.')
                    .setColor(client.config.embedColor);
                return interaction.reply({ embeds: [embed] });
            } else {
                const playlist = await Playlist.findOne({ userId, name: playlistName });
                if (!playlist) {
                    return interaction.reply('Playlist not found.');
                }
                const embed = new EmbedBuilder()
                    .setTitle(`Playlist: ${playlistName}`)
                    .setDescription(playlist.songs.map((song, index) => `${index + 1}. ${song}`).join('\n') || 'No songs in this playlist.')
                    .setColor(client.config.embedColor);
                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error listing playlists:', error);
            return interaction.reply('An error occurred while listing the playlists.');
        }
    },
};
