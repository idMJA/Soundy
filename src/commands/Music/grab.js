const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grab')
        .setDescription('Sends the current playing song\'s information to your DM'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player || !player.queue.current) {
            return interaction.reply({ content: "There is no active player in this server.", ephemeral: true });
        }

        const currentTrack = player.queue.current;
        
        const songInfo = [
            `${client.config.musicEmoji} **Title:** ${currentTrack.title}`,
            `${client.config.linkEmoji} **URL:** ${currentTrack.uri}`,
            `${client.config.clockEmoji} **Duration:** ${currentTrack.isStream ? 'LIVE' : formatTime(currentTrack.duration)}`,
            `${client.config.userEmoji} **Requested by:** ${currentTrack.requester}`
        ].join('\n');

        try {
            await interaction.user.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setTitle(`${client.config.musicEmoji} Now Playing: ${currentTrack.title}`)
                        .setURL(currentTrack.uri)
                        .setThumbnail(currentTrack.artworkUrl || currentTrack.thumbnail)
                        .setDescription(songInfo)
                        .setFooter({ text: 'Enjoy the music! 🎧' })
                        .setTimestamp()
                ]
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`I have sent you a DM with the song information!`)
                ],
                ephemeral: true
            });
        } catch (error) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`Cannot send DM. Please check your privacy settings!`)
                ],
                ephemeral: true
            });
        }
    }
}; 