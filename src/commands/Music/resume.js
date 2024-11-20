const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused track'),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player || !player.queue.current) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} There is no track currently playing.`)
                ],
                ephemeral: true
            });
        }

        if (!player.paused) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} The player is not paused.`)
                ],
                ephemeral: true
            });
        }

        player.pause(false);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} The player has been resumed.`)
            ],
            ephemeral: true
        });
    },
};
