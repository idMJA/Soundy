const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Make the bot join your voice channel'),
    async execute(interaction, client) {
        const { channel } = interaction.member.voice;
        if (!channel) {
            return interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        }

        let player = client.manager.players.get(interaction.guildId);
        if (player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`I'm already connected in <#${player.voiceChannel}> !\nPlease use \`\`/leave\`\` first.`)
                ],
                ephemeral: true
            });
        }

        try {
            player = await client.manager.create({
                guild: interaction.guildId,
                voiceChannel: channel.id,
                textChannel: interaction.channelId,
                volume: 100,
                selfDeafen: true
            });
            await player.connect();

            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`I've joined <#${channel.id}>! Use /play to start the music!`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error joining voice channel:', error);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setTitle(`${client.config.noEmoji} Error`)
                        .setDescription(`Something went wrong while trying to join the voice channel.\nPlease try again later!`)
                ],
                ephemeral: true
            });
        }
    },
}; 