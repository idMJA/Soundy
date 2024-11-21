const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getNodeInfo } = require('../../utils/sharedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('Replay the currently playing song'),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

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

        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} No music is currently playing!`)
                ],
                ephemeral: true
            });
        }

        const currentTrack = player.queue.current;
        if (!currentTrack) {
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} No song to replay!`)
                ],
                ephemeral: true
            });
        }

        // Replay the current song
        player.seek(0);

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Replaying Song')
            .setDescription(`**[${currentTrack.title}](${currentTrack.uri})**`)
            .setThumbnail(currentTrack.artworkUrl || currentTrack.thumbnail)
            .addFields(
                { name: 'Artist', value: `\`\`${currentTrack.author}\`\``, inline: true },
                { name: 'Duration', value: `\`\`${formatTime(currentTrack.duration)}\`\``, inline: true },
                { name: 'Node', value: `\`\`${getNodeInfo(player)}\`\``, inline: false }
            )
            .setFooter({
                text: `Requested by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        return interaction.followUp({ embeds: [embed] });
    },
};

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    return `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
