const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek to a specific time in the current track')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time to seek to (format: MM:SS or HH:MM:SS). Example: 01:30 or 01:30:45')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        const time = interaction.options.getString('time');
        const player = client.manager.players.get(interaction.guildId);

        if (!player || !player.queue.current) {
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} No track is currently playing!`)
                ],
                ephemeral: true
            });
        }

        const { channel } = interaction.member.voice;
        if (!channel || channel.id !== player.voiceChannel) {
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} You need to be in the same voice channel as the bot to use this command!`)
                ],
                ephemeral: true
            });
        }

        // Validate and parse time string (MM:SS or HH:MM:SS) 
        const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
        const matches = time.match(timeRegex);

        if (!matches) {
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} Invalid time format! Please use MM:SS or HH:MM:SS.\nExample: \`01:30\` for 1 minute 30 seconds, or \`01:30:45\` for 1 hour 30 minutes 45 seconds.`)
                ],
                ephemeral: true
            });
        }

        const hours = matches[3] ? parseInt(matches[1], 10) : 0;
        const minutes = matches[3] ? parseInt(matches[2], 10) : parseInt(matches[1], 10);
        const seconds = matches[3] ? parseInt(matches[2], 10) : parseInt(matches[1], 10);

        const seekTime = ((hours * 3600) + (minutes * 60) + seconds) * 1000;


        const trackDuration = player.queue.current.duration;
        if (seekTime > trackDuration || seekTime < 0) {
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} The seek time must be between 0:00 and ${formatTime(trackDuration)}.`)
                ],
                ephemeral: true
            });
        }

        try {
            player.seek(seekTime);

            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.yesEmoji} Successfully seeked to \`${formatTime(seekTime)}\`!`)
                ],
                ephemeral: true
            });
        } catch (error) {
            console.error('Seek Error:', error);
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} An error occurred while seeking. Please try again.`)
                ],
                ephemeral: true
            });
        }
    }
};

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
