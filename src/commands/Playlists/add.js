const { SlashCommandBuilder } = require('discord.js');
const Playlist = require('../../schemas/playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a song to a playlist')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('The name of the playlist')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('song')
                .setDescription('The song to add')
                .setRequired(true)),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const playlistName = interaction.options.getString('playlist');
        const song = interaction.options.getString('song');

        try {
            const playlist = await Playlist.findOne({ userId, name: playlistName });
            
            if (!playlist) {
                return interaction.reply('Playlist not found.');
            }

            playlist.songs.push(song);
            await playlist.save();

            return interaction.reply(`Added "${song}" to playlist "${playlistName}".`);
        } catch (error) {
            console.error('Error adding song to playlist:', error);
            return interaction.reply('An error occurred while adding the song to the playlist.');
        }
    },
};
