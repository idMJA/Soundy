const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set loop mode for the player')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('The loop mode to set')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )),
    async execute(interaction, client) {
        const player = client.manager.players.get(interaction.guildId);
        if (!player) {
            return interaction.reply({ content: 'There is no active player in this server.', ephemeral: true });
        }

        const mode = interaction.options.getString('mode');
        switch (mode) {
            case 'track':
                player.trackRepeat = true;
                player.queueRepeat = false;
                break;
            case 'queue':
                player.trackRepeat = false;
                player.queueRepeat = true;
                break;
            case 'off':
                player.trackRepeat = false;
                player.queueRepeat = false;
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`Loop mode set to: ${mode}`)
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    },
};
