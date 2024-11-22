const { EmbedBuilder } = require('discord.js');
const { updateVoiceStatus } = require('../../utils/voiceStatus');
const { deleteNowPlayingEmbed, clearInactivityTimer } = require('../../utils/sharedUtils');
const SetupSchema = require('../../schemas/setupSystem');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const player = client.manager.players.get(oldState.guild.id || newState.guild.id);
        if (!player) return;

        // Bot was disconnected
        if (oldState.channelId && !newState.channelId && newState.id === client.user.id) {
            await updateVoiceStatus(client, player, null);

            const setupData = await SetupSchema.findOne({ 
                guildId: player.guild
            });

            if (setupData) {
                await updateSetupMessage(client, player);
                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription('I was disconnected from the voice channel. The queue has been cleared.')
                    .setTimestamp();
                    
                client.channels.cache.get(player.textChannel)?.send({
                    embeds: [embed], 
                    flags: 4096
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            }

            deleteNowPlayingEmbed(player);
            await player.destroy();
            return;
        }

        // Check if the bot is alone in the voice channel
        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        if (!voiceChannel) return;

        if (voiceChannel.members.size === 1 && voiceChannel.members.first().id === client.user.id) {
            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle(`${client.config.warnEmoji} Channel Empty`)
                .setDescription(`Everyone has left the voice channel.\nI'll be leaving in 1 minutes if no one joins!`)
                .setTimestamp();

            client.channels.cache.get(player.textChannel)?.send({
                embeds: [embed],
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

            // Set a timeout to disconnect after 1 minutes if no one joins
            const timeoutId = setTimeout(async () => {
                const currentChannel = client.channels.cache.get(player.voiceChannel);
                if (currentChannel && currentChannel.members.size === 1 && currentChannel.members.first().id === client.user.id) {
                    const leaveEmbed = new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setTitle(`${client.config.warnEmoji} Auto Disconnect`)
                        .setDescription(`I've left the voice channel due to inactivity.\nThe queue has been cleared.`)
                        .setTimestamp();

                    client.channels.cache.get(player.textChannel)?.send({
                        embeds: [leaveEmbed],
                        flags: 4096
                    }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                    await updateVoiceStatus(client, player, null);
                    deleteNowPlayingEmbed(player);
                    await player.destroy();
                }
            }, 60000); // 1 minute

        } else {
            // If there are other members in the channel, clear any existing timeout
            clearInactivityTimer(player.guild);
        }
    },
}; 