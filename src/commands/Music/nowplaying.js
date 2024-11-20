const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTime, platformIcons } = require('../../utils/sharedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Display information about the currently playing track'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player || !player.queue.current) {
            return interaction.reply({ content: 'There is no track currently playing.', ephemeral: true });
        }

        const track = player.queue.current;

        const platform = track.sourceName.toLowerCase();
        const iconUrl = platformIcons[platform] || platformIcons.default;

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setAuthor({ name: 'Now Playing', iconURL: iconUrl })
            .setDescription(`## [${track.title}](${track.uri})`)
            .addFields([
                { name: `${client.config.artistEmoji} Artist`, value: `\` ${track.author} \``, inline: true },
                { name: `${client.config.clockEmoji} Duration`, value: `\` ${formatTime(track.duration)} \``, inline: true },
                { name: `${client.config.userEmoji} Requested by`, value: `${track.requester || 'Unknown'}`, inline: true }
            ])
            .setThumbnail(track.artworkUrl || track.thumbnail)
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    },
};
