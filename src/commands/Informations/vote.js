const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Support this Bot by voting for it!'),
    
    async execute(interaction, client) {
        const voteEmbed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Vote for Soundy!')
            .setDescription(`## ${client.config.sparklesEmoji} **Support the bot by voting for it on Top.gg!**\n\n> ${client.config.infoEmoji} **Note:** You can vote once every 12 hours!\n\n> ${client.config.linkEmoji} **Vote Link:** [Click here to vote](${client.config.voteLink})\n\n> ${client.config.musicEmoji} **You're awesome for choosing us! May your day be filled with fantastic tunes and good vibes. Let's keep the music playing!**`)
            .setFooter({ text: 'Thank you for your support!', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const voteButton = new ButtonBuilder()
            .setLabel('Vote')
            .setStyle(ButtonStyle.Link)
            .setURL(client.config.voteLink)
            .setEmoji(client.config.partyEmoji);

        const inviteButton = new ButtonBuilder()
            .setLabel('Invite')
            .setStyle(ButtonStyle.Link)
            .setURL(client.config.botInvite)
            .setEmoji(client.config.paperplaneEmoji);

        const row = new ActionRowBuilder()
            .addComponents(voteButton, inviteButton);

        await interaction.reply({ embeds: [voteEmbed], components: [row] });
    }
};
