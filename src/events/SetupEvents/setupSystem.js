const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const SetupSchema = require('../../schemas/setupSystem');
const { updateSetupMessage } = require('../../utils/setupUtils');
const { formatTime, getNodeInfo, handleInactivity, clearInactivityTimer } = require('../../utils/sharedUtils');
const { updateVoiceStatus } = require('../../utils/voiceStatus');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const setupData = await SetupSchema.findOne({ 
            guildId: message.guild.id,
            channelId: message.channel.id 
        });

        if (!setupData) return;

        await message.delete().catch(() => {});

        const { member, content } = message;
        
        if (!member.voice.channel) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.warnEmoji} You must be in a voice channel to play music!`)
                ],
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete(), 5000));
        }

        const permissions = member.voice.channel.permissionsFor(client.user);
        if (!permissions.has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.warnEmoji} I don't have permission to join/speak in your voice channel!`)
                ],
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete(), 5000));
        }

        let player = client.manager.players.get(message.guildId);
        if (!player) {
            player = await client.manager.create({
                guild: message.guildId,
                voiceChannel: member.voice.channelId,
                textChannel: message.channelId,
                volume: 100,
                selfDeafen: true
            });
            await player.connect();
        }

        handleInactivity(client, player);

        const searchQuery = content;
        const result = await player.search(searchQuery, message.author);

        if (result.loadType === 'error' || result.loadType === 'empty') {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} No results found!`)
                ],
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete(), 5000));
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Added to Queue')
            .setFooter({ 
                text: `Requested by ${message.author.username}`, 
                iconURL: message.author.displayAvatarURL() 
            })
            .setTimestamp();

        switch (result.loadType) {
            case 'playlist':
                const playlist = result.playlist;
                for (const track of playlist.tracks) {
                    track.requester = message.author;
                    player.queue.add(track);
                }
                embed.setDescription(`**Playlist:**\n> **[${playlist.name}](${searchQuery})**`)
                    .addFields(
                        { name: `Tracks`, value: `${playlist.tracks.length} songs added to the queue` },
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

        message.channel.send({
            embeds: [embed],
            flags: 4096
        }).then(msg => setTimeout(() => msg.delete(), 5000));

        if (!player.playing && !player.paused) {
            player.play();
            handleInactivity(client, player);
        }
    }
};

function setupVoiceStateHandler(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        const setupData = await SetupSchema.findOne({ 
            guildId: oldState.guild.id || newState.guild.id 
        });

        if (!setupData) return;

        const player = client.manager.players.get(oldState.guild.id || newState.guild.id);
        if (!player) return;

        // Check if bot was disconnected
        if (newState.id === client.user.id && !newState.channelId) {
            await updateVoiceStatus(client, player, null);
            await updateSetupMessage(client, player);
            
            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription('I was disconnected from the voice channel. The queue has been cleared.')
                .setTimestamp();
                
            client.channels.cache.get(player.textChannel)?.send({
                embeds: [embed], 
                flags: 4096
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

            await player.destroy();
            return;
        }

        // Check if bot is alone in voice channel
        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        if (voiceChannel) {
            const members = voiceChannel.members.filter(member => !member.user.bot);
            if (members.size === 0) {
                await updateSetupMessage(client, player);

                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.leaveEmoji} Left the voice channel because I was alone.`)
                    .setTimestamp();
                
                client.channels.cache.get(player.textChannel)?.send({
                    embeds: [embed],
                    flags: 4096
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                await updateVoiceStatus(client, player, null);
                await player.destroy();
                return;
            }
        }

        handleInactivity(client, player);
    });
}