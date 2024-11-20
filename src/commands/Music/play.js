const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getNodeInfo } = require('../../utils/sharedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption(option => 
            option.setName('song')
                .setDescription('The song to play')
                .setRequired(true)),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: false });
        const query = interaction.options.getString('song');

        const { channel } = interaction.member.voice;
        if (!channel) {
            return interaction.followUp({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} You need to be in a voice channel to use this command!`)
                ]
            });
        }

        let player = client.manager.players.get(interaction.guildId);
        if (!player) {
            player = await client.manager.create({
                guild: interaction.guildId,
                voiceChannel: channel.id,
                textChannel: interaction.channelId,
                volume: 100,
                selfDeafen: true,
            });
            await player.connect();
        }

        // When searching for tracks, use the player's search method
        const result = await player.search(query, interaction.user);

        // Handle search failure
        if (result.loadType === 'error' || result.loadType === 'empty') {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} No results found for: ${query}`)
                ]
            });
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Added to Queue')
            .setFooter({ 
                text: `Requested by ${interaction.user.username} | Node: ${getNodeInfo(player)}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Handle different load types
        switch (result.loadType) {
            case 'playlist':
                const playlist = result.playlist;
                for (const track of playlist.tracks) {
                    player.queue.add(track);
                }
                embed.setDescription(`**Playlist:**\n> **[${playlist.name}](${query})**`)
                    .addFields(
                        { name: `Tracks`, value: `${playlist.tracks.length} songs added to the queue`, inline: true },
                        { name: `Node`, value: `\`\` ${getNodeInfo(player)} \`\``, inline: false }
                    );
                break;

            case 'track':
            case 'search':
                const track = result.tracks[0];
                player.queue.add(track);
                embed.setDescription(`**Song:**\n> **[${track.title}](${track.uri})**`)
                    .setThumbnail(track.artworkUrl || track.thumbnail)
                    .addFields(
                        { name: `Artist`, value: `\`\` ${track.author} \`\``, inline: true },
                        { name: `Duration`, value: `\`\` ${formatTime(track.duration)} \`\``, inline: true },
                        { name: `Node`, value: `\`\` ${getNodeInfo(player)} \`\``, inline: false }
                    );
                break;
        }

        if (!player.playing && !player.paused) {
            player.play();
        }

        return interaction.followUp({ embeds: [embed] });
    }
};

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
