const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing track'),
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

        if (player.paused) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.noEmoji} The player is already paused.`)
                ],
                ephemeral: true
            });
        }

        player.pause(true);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} The player has been paused.`)
            ],
            ephemeral: true
        });
    },
};
