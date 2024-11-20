const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { updateSetupMessage } = require('../../utils/setupUtils');
const { platformIcons, formatTime, deleteNowPlayingEmbed, playerMessages, updateLastActivity, getNodeInfo, handleInactivity, clearInactivityTimer, handleBotAlone } = require('../../utils/sharedUtils');
const { getButtons } = require('../SetupEvents/setupButtons');
const SetupSchema = require('../../schemas/setupSystem');
const { updateVoiceStatus } = require('../../utils/voiceStatus');

module.exports = (client) => {
    if (!client.manager) {
        client.logs.error('Manager is not initialized');
        return;
    }

    // Add check for inactive players every minute
    setInterval(async () => {
        client.manager.players.forEach(player => {
            if (!player.playing && !player.paused) {
                handleInactivity(client, player);
            }
        });
    }, 60000);

    client.manager.on("trackStart", async (player, track) => {
        handleInactivity(client, player);
        updateLastActivity(player.guild, 'Started playing music', track.requester);
        await updateVoiceStatus(client, player, track);

        const setupData = await SetupSchema.findOne({ 
            guildId: player.guild
        });

        if (setupData) {
            await updateSetupMessage(client, player, track);
            return;
        }

        const previousMessage = playerMessages.get(player.guild);
        if (previousMessage) {
            try {
                await previousMessage.delete();
            } catch (error) {
                console.error('Error deleting previous message:', error);
            }
        }

        const platform = track.sourceName.toLowerCase();
        const iconUrl = platformIcons[platform] || platformIcons.default;

        const isPlayingEmbed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setAuthor({ name: "Now Playing", iconURL: iconUrl })
            .setDescription(`## [${track.title}](${track.uri})`)
            .addFields([
                { 
                    name: `${client.config.artistEmoji} Artist`, 
                    value: `\`${track.author}\``, 
                    inline: true 
                },
                { 
                    name: `${client.config.clockEmoji} Duration`, 
                    value: `\` ${formatTime(track.duration)} \``, 
                    inline: true 
                },
                { 
                    name: `${client.config.userEmoji} Requested by`, 
                    value: `${track.requester || 'Unknown'}`, 
                    inline: true 
                },
                {
                    name: `${client.config.listEmoji} Node`,
                    value: `\` ${getNodeInfo(player)} \``,
                    inline: true
                }
            ])
            .setImage(track.artworkUrl || track.thumbnail)
            .setTimestamp();

        const components = getButtons(client);

        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            const message = await channel.send({
                embeds: [isPlayingEmbed], 
                components, 
                flags: 4096 
            });
            playerMessages.set(player.guild, message);
        }
    });

    client.manager.on('queueEnd', async (player) => {
        updateLastActivity(player.guild, 'Queue ended');
        await updateVoiceStatus(client, player, null);

        const setupData = await SetupSchema.findOne({ 
            guildId: player.guild
        });

        if (setupData) {
            await updateSetupMessage(client, player);
            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`${client.config.infoEmoji} The queue is finished.`)
                .setTimestamp();
            
            client.channels.cache.get(player.textChannel)?.send({
                embeds: [embed], 
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            return;
        }

        deleteNowPlayingEmbed(player);
    });

    // Add voice state event handlers
    client.manager.on('voiceStateUpdate', async (player, oldState, newState) => {
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

        // Check if bot is alone in voice channel
        await handleBotAlone(client, player);
    });

    // Add this after the voiceStateUpdate event handler
    client.manager.on('playerMove', async (player, oldChannel, newChannel) => {
        handleInactivity(client, player);

        // Clear voice status from old channel
        if (oldChannel) {
            try {
                await client.rest.put(`/channels/${oldChannel}/voice-status`, {
                    body: { status: null }
                });
            } catch (error) {
                client.logs.error(`Failed to clear old channel voice status: ${error.message}`);
            }
        }

        if (!newChannel) {
            // Bot was disconnected
            await updateVoiceStatus(client, player, null);

            const setupData = await SetupSchema.findOne({ 
                guildId: player.guild,
                channelId: player.textChannel 
            });

            if (setupData) {
                await updateSetupMessage(client, player);
                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`I was moved out to <#${oldChannel}>. The queue has been cleared.`)
                    .setTimestamp();

                client.channels.cache.get(player.textChannel)?.send({
                    embeds: [embed],
                    flags: 4096
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
                return;
            }

            deleteNowPlayingEmbed(player);
            await player.destroy();
        } else {
            // Player was moved to a new channel
            player.voiceChannel = newChannel;
            
            // Send move notification
            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`${client.config.infoEmoji} I was moved to <#${newChannel}>`)
                .setTimestamp();

            client.channels.cache.get(player.textChannel)?.send({
                embeds: [embed],
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

            // Update voice status for new channel if there's a current track
            if (player.queue.current) {
                await updateVoiceStatus(client, player, player.queue.current);
            }
        }
    });

    // Handle player disconnect
    client.manager.on('playerDisconnect', async (player) => {
        await updateVoiceStatus(client, player, null);

        const setupData = await SetupSchema.findOne({ 
            guildId: player.guild,
            channelId: player.textChannel 
        });

        if (setupData) {
            await updateSetupMessage(client, player);
            return;
        }

        deleteNowPlayingEmbed(player);
        await player.destroy();
    });

    // Handle player destroy 
    client.manager.on('playerDestroy', async (player) => {
        updateLastActivity(player.guild, 'Player destroyed');
        await updateVoiceStatus(client, player, null);

        const setupData = await SetupSchema.findOne({ 
            guildId: player.guild,
            channelId: player.textChannel 
        });

        if (setupData) {
            await updateSetupMessage(client, player);
            return;
        }

        deleteNowPlayingEmbed(player);
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;
        await buttonInteractions(interaction, client);
    });

}

async function buttonInteractions(interaction, client) {
    const setupData = await SetupSchema.findOne({ guildId: interaction.guildId });
    
    if (setupData) {
        const { handleSetupButton } = require('../SetupEvents/setupButtons');
        await handleSetupButton(interaction, client, interaction.customId);
        return;
    }

    const player = client.manager.players.get(interaction.guildId);
    if (!player) {
        const errorEmbed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`${client.config.warnEmoji} The player is no longer active.`);
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    try {
        await interaction.deferUpdate();

        let responseEmbed;
        switch (interaction.customId) {
            case 'clear':
                player.queue.clear();
                updateLastActivity(player.guild, 'ClearQueue', interaction.user);
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Queue has been cleared.`);
                break;
            case 'shuffle':
                player.queue.shuffle();
                updateLastActivity(player.guild, 'Shuffled', interaction.user);
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Queue has been shuffled.`);
                break;
            case 'volume_down':
                const newVolDown = Math.max(0, player.volume - 10);
                await player.setVolume(newVolDown);
                updateLastActivity(player.guild, `Volume set to ${newVolDown}%`, interaction.user);
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.volDownEmoji} Volume set to ${newVolDown}%`);
                break;
            case 'volume_up':
                const newVolUp = Math.min(100, player.volume + 10);
                await player.setVolume(newVolUp);
                updateLastActivity(player.guild, `Volume set to ${newVolUp}%`, interaction.user);
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.volUpEmoji} Volume set to ${newVolUp}%`);
                break;
            case 'queue':
                const queue = player.queue;
                const currentTrack = player.queue.current;

                if (!currentTrack) {
                    responseEmbed = new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription('There are no tracks in the queue.');
                    break;
                }

                const tracks = queue.map((track, i) => {
                    return `${i + 1}. [${track.title}](${track.uri}) - ${track.requester || 'Unknown'}`;
                });

                const chunkedTracks = tracks.length > 10 ? tracks.slice(0, 10) : tracks;
                const remaining = tracks.length > 10 ? tracks.length - 10 : 0;

                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle('Current Queue')
                    .setDescription(`**Now Playing:**\n[${currentTrack.title}](${currentTrack.uri}) - ${currentTrack.requester}\n\n**Up Next:**\n${chunkedTracks.join('\n')}${remaining ? `\n\nand ${remaining} more...` : ''}`)
                    .setFooter({ text: `Total tracks: ${tracks.length + 1}` });
                break;
            case 'pause':
                await player.pause(!player.paused);
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} ${player.paused ? 'Paused the player.' : 'Resumed playback.'}`);
                break;
            case 'previous':
                if (!player.queue.previous || player.queue.previous.length === 0) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.embedColor)
                                .setDescription(`${client.config.noEmoji} There is no previous song!`)
                        ],
                        ephemeral: true
                    });
                }
                player.queue.add(player.queue.previous[player.queue.previous.length - 1]);
                player.stop();
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColor)
                            .setDescription(`${client.config.yesEmoji} Playing previous song!`)
                    ],
                    ephemeral: true
                });
            case 'stop':
                updateLastActivity(player.guild, 'Stopped playback');
                deleteNowPlayingEmbed(player);
                await player.destroy();
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Stopped playback and cleared the queue.`);
                break;
            case 'skip':
                player.stop();
                updateLastActivity(player.guild, 'Skipped track');
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Skipped the current song!`);
                break;
            case 'loop':
                const currentMode = player.queueRepeat ? 'queue' : player.trackRepeat ? 'track' : 'none';
                let newMode;
                
                switch (currentMode) {
                    case 'none':
                        player.trackRepeat = true;
                        player.queueRepeat = false;
                        newMode = 'Track';
                        break;
                    case 'track':
                        player.trackRepeat = false;
                        player.queueRepeat = true;
                        newMode = 'Queue';
                        break;
                    case 'queue':
                    default:
                        player.trackRepeat = false;
                        player.queueRepeat = false;
                        newMode = 'None';
                        break;
                }

                updateLastActivity(player.guild, `Loop mode set to ${newMode}`);
                responseEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Loop mode set to: \`${newMode}\``);
                break;
            default:
                console.log(`Unknown button: ${interaction.customId}`);
                return;
        }

        await interaction.followUp({ embeds: [responseEmbed], ephemeral: true });

        const setupData = await SetupSchema.findOne({ guildId: interaction.guildId });
        if (setupData) {
            await updateSetupMessage(client, player, player.queue.current);
        }

    } catch (error) {
        console.error('Error handling button interaction:', error);
        try {
            const errorEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`${client.config.noEmoji} An error occurred while processing your request.`);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
}

async function updateButtonState(interaction, player) {
    const message = await interaction.message.fetch();
    const row = ActionRowBuilder.from(message.components[0]);

    const pauseButton = ButtonBuilder.from(row.components.find(c => c.data.custom_id === 'pause'));
    pauseButton.setEmoji(player.paused ? client.config.playEmoji : client.config.pauseEmoji);

    const loopButton = ButtonBuilder.from(row.components.find(c => c.data.custom_id === 'loop'));
    loopButton.setStyle(player.loop !== 'none' ? ButtonStyle.Success : ButtonStyle.Secondary);

    row.setComponents(pauseButton, row.components[1], row.components[2], row.components[3], loopButton);

    await interaction.message.edit({ components: [row] });
}
