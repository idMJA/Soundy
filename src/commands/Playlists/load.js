const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Playlist = require('../../schemas/playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('load')
        .setDescription('Load a playlist into the current queue')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('The name of the playlist to load')
                .setRequired(true)),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const playlistName = interaction.options.getString('playlist');

        try {
            const playlist = await Playlist.findOne({ userId, name: playlistName });
            
            if (!playlist) {
                return interaction.reply('Playlist not found.');
            }

            const { channel } = interaction.member.voice;
            if (!channel) {
                return interaction.reply('You need to be in a voice channel to use this command!');
            }

            let player = client.manager.players.get(interaction.guildId);
            if (!player) {
                player = client.manager.create({
                    guild: interaction.guildId,
                    voiceChannel: channel.id,
                    textChannel: interaction.channelId,
                    volume: 100,
                });
                player.connect();
            }

            await interaction.deferReply();

            const loadedTracks = [];
            for (const song of playlist.songs) {
                const result = await client.manager.search(song, interaction.user);
                if (result.tracks && result.tracks.length > 0) {
                    const track = result.tracks[0];
                    player.queue.add(track);
                    loadedTracks.push(track);
                }
            }

            if (loadedTracks.length === 0) {
                return interaction.followUp('No songs could be loaded from the playlist.');
            }

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Playlist Loaded')
                .setDescription(`Loaded ${loadedTracks.length} songs from playlist "${playlistName}"`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            if (!player.playing && !player.paused && player.queue.size) {
                player.play();
            }

            return interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('Error loading playlist:', error);
            return interaction.followUp('An error occurred while loading the playlist.');
        }
    },
};
