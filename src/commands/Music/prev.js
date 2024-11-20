const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Play the previous song'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} There is no active player in this server.`)
                ],
                ephemeral: true
            });
        }

        if (!player.queue.previous) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} There is no previous track to play.`)
                ],
                ephemeral: true
            });
        }

        try {
            const previousTrack = player.queue.previous;
            player.queue.unshift(previousTrack);
            player.stop();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setTitle('Playing Previous Track')
                        .setDescription(`${client.config.previousEmoji} Playing: **${previousTrack.title}**`)
                        .setThumbnail(previousTrack.artworkUrl || previousTrack.thumbnail || client.config.banner)
                        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp()
                ]
            });
        } catch (error) {
            console.error("Error playing previous track:", error);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} An error occurred while playing the previous track.`)
                ],
                ephemeral: true
            });
        }
    },
};