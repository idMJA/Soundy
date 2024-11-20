const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed, noPlayerError } = require('../../utils/embedUtils');
const { updateVoiceStatus } = require('../../utils/voiceStatus');
const { updateLastActivity } = require('../../utils/sharedUtils');
function getButtons(client) {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('shuffle')
                .setEmoji(client.config.shuffleEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('previous')
                .setEmoji(client.config.previousEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('pause')
                .setEmoji(client.config.pauseEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setEmoji(client.config.skipEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('loop')
                .setEmoji(client.config.loopEmoji)
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('clear')
                .setEmoji(client.config.trashEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('volume_down')
                .setEmoji(client.config.volDownEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji(client.config.stopEmoji)
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('volume_up')
                .setEmoji(client.config.volUpEmoji)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('queue')
                .setEmoji(client.config.listEmoji)
                .setStyle(ButtonStyle.Secondary)
        );

    return [row1, row2];
}

function getLoopButtons(client, currentMode = 'none') {
    return new ActionRowBuilder().addComponents([
        new ButtonBuilder()
            .setCustomId('loop_none')
            .setLabel('Disable Loop')
            .setStyle(currentMode === 'none' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('loop_track')
            .setLabel('Loop Track')
            .setStyle(currentMode === 'track' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('loop_queue')
            .setLabel('Loop Queue')
            .setStyle(currentMode === 'queue' ? ButtonStyle.Success : ButtonStyle.Secondary),
    ]);
}

async function handleSetupButton(interaction, client, action) {
    const player = client.manager.players.get(interaction.guild.id);
    
    try {
        let components = getButtons(client);

        if (action === 'queue') {
            if (!player || !player.queue.current) {
                return interaction.reply({
                    embeds: [createEmbed('No tracks in queue', client)],
                    ephemeral: true
                });
            }
            const tracks = player.queue.map((track, i) => `${i + 1}. [${track.title}](${track.uri})`);
            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Current Queue')
                .setDescription(`**Now Playing:**\n[${player.queue.current.title}](${player.queue.current.uri})\n\n**Up Next:**\n${tracks.slice(0, 10).join('\n')}${tracks.length > 10 ? `\n...and ${tracks.length - 10} more` : ''}`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (!player) {
            return interaction.reply({
                embeds: [createEmbed('There is no active player!', client)],
                ephemeral: true
            });
        }

        let response;
        switch (action) {
            case 'stop':
                await updateVoiceStatus(client, player, null);
                updateLastActivity(interaction.guild.id, 'Stopped', interaction.user);
                await player.destroy();
                response = 'Stopped the player';
                
                const setupEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.config.musicEmoji} Soundy Control Panel`)
                    .setDescription('No song is currently playing.\nJoin a voice channel and queue songs by name or url using **/play** or click the button below.')
                    .setImage(client.config.banner);

                components.forEach(row => {
                    row.components.forEach(button => button.setDisabled(true));
                });

                await interaction.message.edit({ embeds: [setupEmbed], components });
                break;

            case 'pause':
                player.pause(!player.paused);
                response = `${player.paused ? 'Paused' : 'Resumed'} the player`;
                updateLastActivity(interaction.guild.id, `${player.paused ? 'Paused' : 'Resumed'}`, interaction.user);
                
                components.forEach(row => {
                    row.components.forEach(button => {
                        if (button.data.custom_id === 'pause') {
                            button.setEmoji(player.paused ? client.config.playEmoji : client.config.pauseEmoji);
                        }
                    });
                });
                
                await interaction.message.edit({ components });
                break;

            case 'skip':
                updateLastActivity(interaction.guild.id, 'Skipped', interaction.user);
                player.stop();
                response = 'Skipped to the next track';
                break;

            case 'clear':
                updateLastActivity(interaction.guild.id, 'Cleared', interaction.user);
                player.queue.clear();
                response = 'Cleared the queue';
                break;

            case 'shuffle':
                if (!player.queue.length) {
                    return interaction.reply({
                        embeds: [createEmbed('No tracks in queue to shuffle', client)],
                        ephemeral: true
                    });
                }
                player.queue.shuffle();
                response = 'Queue has been shuffled';
                updateLastActivity(interaction.guild.id, 'Shuffled', interaction.user);
                break;

            case 'loop':
                await handleLoopSelection(interaction, client);
                return;

            case 'loop_none':
            case 'loop_track':
            case 'loop_queue':
                if (!player) return noPlayerError(interaction, client);
                const mode = action.split('_')[1];
                
                switch (mode) {
                    case 'track':
                        player.trackRepeat = true;
                        player.queueRepeat = false;
                        newMode = 'Track';
                        break;
                    case 'queue':
                        player.trackRepeat = false;
                        player.queueRepeat = true;
                        newMode = 'Queue';
                        break;
                    case 'none':
                    default:
                        player.trackRepeat = false;
                        player.queueRepeat = false;
                        newMode = 'None';
                        break;
                }
                
                const updatedLoopEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Loop mode has been set to: **${mode}**`);

                await interaction.update({
                    embeds: [updatedLoopEmbed],
                    components: []
                });
                
                if (client.manager.players.get(interaction.guild.id)) {
                    const { updateSetupMessage } = require('../../utils/setupUtils');
                    await updateSetupMessage(client, player, player.queue.current);
                }
                return;

            case 'volume_up':
                if (!player) return noPlayerError(interaction, client);
                const newVolUp = Math.min(player.volume + 10, 100);
                player.setVolume(newVolUp);
                response = `Volume set to: ${newVolUp}%`;
                updateLastActivity(interaction.guild.id, response, interaction.user);
                break;

            case 'volume_down':
                if (!player) return noPlayerError(interaction, client);
                const newVolDown = Math.max(player.volume - 10, 0);
                player.setVolume(newVolDown);
                response = `Volume set to: ${newVolDown}%`;
                updateLastActivity(interaction.guild.id, response, interaction.user);
                break;
        }

        await interaction.reply({
            embeds: [createEmbed(response, client)],
            ephemeral: true
        });

        if (action !== 'stop' && client.manager.players.get(interaction.guild.id)) {
            const { updateSetupMessage } = require('../../utils/setupUtils');
            await updateSetupMessage(client, player, player.queue.current);
        }

    } catch (error) {
        console.error('Setup button error:', error);
        if (!interaction.replied) {
            await interaction.reply({
                embeds: [createEmbed(`${client.config.noEmoji} An error occurred.`, client)],
                ephemeral: true
            });
        }
    }
}

async function handleLoopSelection(interaction, client) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
        return interaction.reply({
            embeds: [createEmbed('There is no active player!', client)],
            ephemeral: true
        });
    }

    const currentMode = player.queueRepeat ? 'queue' : player.trackRepeat ? 'track' : 'none';
    
    const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`${client.config.loopEmoji} Loop Mode Selection`)
        .setDescription('Select the loop mode you want to use:')
        .addFields([
            { name: 'Current Mode', value: `\`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}\``, inline: true }
        ]);

    const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
            .setCustomId('loop_none')
            .setLabel('Disable Loop')
            .setEmoji(client.config.noEmoji)
            .setStyle(currentMode === 'none' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('loop_track')
            .setLabel('Loop Track')
            .setEmoji(client.config.loopEmoji)
            .setStyle(currentMode === 'track' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('loop_queue')
            .setLabel('Loop Queue')
            .setEmoji(client.config.loopEmoji)
            .setStyle(currentMode === 'queue' ? ButtonStyle.Success : ButtonStyle.Secondary)
    ]);

    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

module.exports = { handleSetupButton, getButtons, getLoopButtons, handleLoopSelection };