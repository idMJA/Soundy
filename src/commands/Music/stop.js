const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { updateVoiceStatus } = require('../../utils/voiceStatus');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the current player and clears the queue'),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guildId);
        
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

        const { deleteNowPlayingEmbed } = require('../../utils/sharedUtils');
        deleteNowPlayingEmbed(player);
        
        // Clear voice status before destroying player
        await updateVoiceStatus(client, player, null);
        await player.destroy();

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Stopped the player and cleared the queue.`)
            ],
            ephemeral: true
        });
    },
};
