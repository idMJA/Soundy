const { SlashCommandBuilder } = require('discord.js');
const Playlist = require('../../schemas/playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a new playlist')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the playlist')
                .setRequired(true)),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const name = interaction.options.getString('name');

        try {
            const existingPlaylist = await Playlist.findOne({ userId, name });
            if (existingPlaylist) {
                return interaction.reply('A playlist with that name already exists.');
            }

            const newPlaylist = new Playlist({ userId, name, songs: [] });
            await newPlaylist.save();
            return interaction.reply(`Playlist "${name}" created successfully.`);
        } catch (error) {
            console.error('Error creating playlist:', error);
            return interaction.reply('An error occurred while creating the playlist.');
        }
    },
};
