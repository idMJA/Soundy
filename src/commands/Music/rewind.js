const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rewind')
        .setDescription('Rewind the current song by (10s)'),
    async execute(interaction, client) {
        const { channel } = interaction.member.voice;
        if (!channel) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} You need to be in a voice channel to use this command!`),
                ], 
                ephemeral: true
            });
        }

        let player = client.manager.players.get(interaction.guildId);
        if (!player || !player.playing) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} There is no song currently playing!`),
                ],
                ephemeral: true
            });
        }

        // Calculate the new timestamp (rewind by 10 seconds)
        const currentTime = player.position;
        const rewindTime = Math.max(currentTime - 10000, 0);

        try {
            player.seek(rewindTime);

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`${client.config.rewind} Rewinded the song by 10 seconds!`)
                .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error while rewinding the song:', error);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} An error occurred while trying to rewind the song.`),
                ],
                ephemeral: true
            });
        }
    },
};
