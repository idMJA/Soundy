const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('Displays frequently asked questions about the bot'),

    async execute(interaction, client) {
        const faqEmbed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle(`${client.config.infoEmoji} Frequently Asked Questions`)
            .setDescription('Here are some common questions about Soundy:')
            .addFields(
                { name: '1. How do I invite Soundy to my server?', value: `Use the \`/invite\` command or click [here](${client.config.botInvite}) to invite me.` },
                { name: '2. How can I support the bot?', value: `You can vote for Soundy on Top.gg using the \`/vote\` command!` },
                { name: '3. What are Soundy\'s main features?', value: 'Soundy offers moderation, fun commands, utility features, and much more!' },
                { name: '4. How do I report a bug?', value: 'Use the `/bugreport` command to report any issues you encounter.' },
                { name: '5. How can I suggest new features?', value: 'Use the `/suggest` command to submit your ideas for new features.' },
                { name: '6. Where can I find the full list of commands?', value: 'Use the `/help` command to see all available commands and categories.' },
                { name: '7. How do I fix issues with playing music?', value: 'If you\'re having trouble playing music with Soundy, try these steps:\n1. Make sure you\'re in a voice channel.\n2. Check if Soundy has permissions to join and speak in the voice channel.\n3. Ensure the music URL or search query is valid.\n4. If problems persist, try disconnecting and reconnecting Soundy to the voice channel.\n5. If issues continue, please report the bug using `/bugreport`.' },
                { name: '8. Second option music fix solution?', value: 'Try to join the voice channel, where Soundy last played music before being kicked. Try using the stop command and try to play the music again!' },
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [faqEmbed] });
    }
};
