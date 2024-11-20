const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Playlist = require('../../schemas/playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Delete a playlist')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the playlist to delete')
                .setRequired(true)),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const playlistName = interaction.options.getString('name');

        try {
            const deletedPlaylist = await Playlist.findOneAndDelete({ userId, name: playlistName });
            
            if (!deletedPlaylist) {
                return interaction.reply('Playlist not found.');
            }

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Playlist Deleted')
                .setDescription(`Successfully deleted playlist "${playlistName}"`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error deleting playlist:', error);
            return interaction.reply('An error occurred while deleting the playlist.');
        }
    },
};
