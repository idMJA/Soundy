const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { formatTime } = require('../../utils/sharedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for a song')
        .addStringOption(option =>
            option
                .setName('song')
                .setDescription('Song to search for')
                .setRequired(true)),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: false });
        const query = interaction.options.getString('song');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.followUp({ embeds: [createErrorEmbed(`You need to be in a voice channel to use this command!`, client)] });
        }

        let result;
        try {
            result = await client.manager.search(query, interaction.member);
            if (result.loadType === 'empty') {
                return interaction.followUp({ embeds: [createErrorEmbed(`Sorry, no results found for "${query}".`, client)] });
            }
        } catch (err) {
            return interaction.followUp({ embeds: [createErrorEmbed(`An error occurred while searching: ${err.message}`, client)] });
        }

        const tracks = result.tracks.slice(0, 10); // Get top 10 results

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle(`Search Results for "${query}"`)
            .setDescription(tracks.map((track, i) => `${i + 1}. **[${track.title}](${track.uri}) - ${track.author} - ${formatTime(track.duration)}**`).join('\n'))
            .setFooter({ 
                text: `Requested by ${interaction.member.displayName}`, 
                iconURL: interaction.member.displayAvatarURL() 
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_track')
                    .setPlaceholder('Select a track')
                    .addOptions(tracks.map((track, i) => ({
                        label: `${i + 1}. ${track.title.slice(0, 95)}${track.title.length > 95 ? '...' : ''}`,
                        description: `Duration: ${formatTime(track.duration)}`,
                        value: i.toString()
                    })))
            );

        const response = await interaction.followUp({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async i => {
            if (i.customId === 'select_track') {
                const selectedTrack = tracks[parseInt(i.values[0])];

                let player = client.manager.players.get(interaction.guildId);
                if (!player) {
                    player = client.manager.create({
                        guild: interaction.guild.id,
                        voiceChannel: voiceChannel.id,
                        textChannel: interaction.channel.id,
                        volume: 100,
                        selfDeafen: true
                    });
                    player.connect();
                }

                player.queue.add(selectedTrack);

                if (!player.playing && !player.paused) {
                    player.play();
                }

                const successEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle('Added to Queue')
                    .setDescription(`**Song:**\n> **[${selectedTrack.title}](${selectedTrack.uri})**`)
                    .setThumbnail(selectedTrack.artworkUrl || selectedTrack.thumbnail)
                    .addFields(
                        { name: `Artist`, value: `\`\` ${selectedTrack.author} \`\``, inline: true },
                        { name: `Duration`, value: `\`\` ${formatTime(selectedTrack.duration)} \`\``, inline: true }
                    )
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await i.update({ embeds: [successEmbed], components: [] });
            }
        });

        collector.on('end', async () => {
            await interaction.editReply({ components: [] });
        });
    }
}

function createErrorEmbed(message, client) {
    return new EmbedBuilder()
        .setColor("Blurple")
        .setTitle(`Error`)
        .setDescription(message)
        .setTimestamp();
}
