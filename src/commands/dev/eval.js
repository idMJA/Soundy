const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { inspect } = require('util');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Evaluates JavaScript code')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The code to evaluate')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!client.config.developers.includes(interaction.user.id)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setTimestamp();
            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        const code = interaction.options.getString('code');

        try {
            let evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = inspect(evaled);

            const resultEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Eval Result')
                .setDescription(`**Input:**\n\`\`\`js\n${code}\n\`\`\`\n**Output:**\n\`\`\`js\n${evaled}\n\`\`\``)
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [resultEmbed], ephemeral: true });
        } catch (err) {
            const errorEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Eval Error')
                .setDescription(`**Input:**\n\`\`\`js\n${code}\n\`\`\`\n**Error:**\n\`\`\`js\n${err}\n\`\`\``)
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};