const { EmbedBuilder } = require('discord.js');
const blacklistSchema = require('../../schemas/blacklistSystem');

module.exports = {
    name: "messageCreate",
    async execute(message, client) {

        if (
            message.author.bot || !message.guild || message.system || message.webhookId
        )
            return;

        const userData = await blacklistSchema.findOne({
            userId: message.author.id,
        });

        if (userData) {
            const embed = new EmbedBuilder()
            .setAuthor({ name: `Soundy` })
            .setTitle(`You are blacklisted from using ${client.user.username}`)
            .setDescription(`Reason: ${userData.reason}`)
            .setColor(client.config.embedColor)
            .setFooter({ text: `You are blacklisted from using this bot` })
            .setTimestamp();

            const reply = await message.reply({ embeds: [embed], fetchReply: true });
            setTimeout(async () => {
                await reply.delete();
            }, 5000);

            return;
        }

        // The rest of the prefix-related code has been removed
    },
};
