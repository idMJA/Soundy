const { SlashCommandBuilder } = require('discord.js');
const Playlist = require('../../schemas/playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a song from a playlist')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('The name of the playlist')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('The index of the song to remove')
                .setRequired(true)),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const playlistName = interaction.options.getString('playlist');
        const index = interaction.options.getInteger('index') - 1;

        try {
            const playlist = await Playlist.findOne({ userId, name: playlistName });
            
            if (!playlist) {
                return interaction.reply('Playlist not found.');
            }

            if (index < 0 || index >= playlist.songs.length) {
                return interaction.reply('Invalid song index.');
            }

            const removed = playlist.songs.splice(index, 1)[0];
            await playlist.save();

            return interaction.reply(`Removed "${removed}" from playlist "${playlistName}".`);
        } catch (error) {
            console.error('Error removing song from playlist:', error);
            return interaction.reply('An error occurred while removing the song from the playlist.');
        }
    },
};
