const { EmbedBuilder, ButtonStyle } = require('discord.js');
const SetupSchema = require('../schemas/setupSystem');
const { platformIcons, formatTime, getLastActivity, getNodeInfo, updateLastActivity } = require('./sharedUtils');
const { getButtons } = require('../events/SetupEvents/setupButtons');

async function updateSetupMessage(client, player, track = null) {
    const setupData = await SetupSchema.findOne({ guildId: player.guild });
    if (!setupData) return;

    try {
        const channel = await client.channels.fetch(setupData.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(setupData.messageId);
        if (!message) return;

        let embed;
        if (track && (player.playing || player.paused)) {
            const platform = track.sourceName.toLowerCase();
            const iconUrl = platformIcons[platform] || platformIcons.default;

            embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setAuthor({ name: player.paused ? "Paused" : "Now Playing", iconURL: iconUrl })
                .setDescription(`## [${track.title}](${track.uri})`)
                .addFields(
                    { name: `${client.config.artistEmoji} Artist`, value: `\`${track.author}\``, inline: true },
                    { name: `${client.config.clockEmoji} Duration`, value: `\` ${formatTime(track.duration)} \``, inline: true },
                    { name: `${client.config.userEmoji} Requested by`, value: `${track.requester}`, inline: true },
                    { name: `${client.config.listEmoji} Node`, value: `\` ${getNodeInfo(player)} \``, inline: true },
                    { name: `${client.config.clockEmoji} Last Activity`, value: `\`${getLastActivity(player.guild)}\``, inline: true }
                )
                .setImage(track.artworkUrl || track.thumbnail)
                .setTimestamp();
        } else {
            embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle(`${client.config.musicEmoji} Soundy Control Panel`)
                .setDescription('No song is currently playing.\nJoin a voice channel and queue songs by name or url using **/play** or click the button below.')
                .setImage(client.config.banner);
        }

        const components = getButtons(client);
        if (!track || (!player.playing && !player.paused)) {
            components.forEach(row => {
                row.components.forEach(button => button.setDisabled(true));
            });
        } else {
            components.forEach((row, index) => {
                if (index < 2) { // Only process button rows, not volume menu
                    row.components.forEach(button => {
                        if (button.data.custom_id === 'pause') {
                            button.setEmoji(player.paused ? client.config.playEmoji : client.config.pauseEmoji);
                        }
                        if (button.data.custom_id === 'loop') {
                            const loopMode = player.queueRepeat ? 'queue' : player.trackRepeat ? 'track' : 'none';
                            button.setStyle(loopMode !== 'none' ? ButtonStyle.Success : ButtonStyle.Secondary);
                        }
                    });
                }
            });
        }

        await message.edit({ embeds: [embed], components });
    } catch (error) {
        console.error('Error updating setup message:', error);
    }
}

module.exports = { updateSetupMessage }; 