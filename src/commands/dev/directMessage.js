const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('direct-message')
    .setDescription('Messages a user, only available for the owner of the bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option.setName('message').setDescription('Specified message will be sent to specified user.').setRequired(true))
    .addUserOption(option => option.setName('user').setDescription('Specified user will be sent the specified message.').setRequired(true)),
    async execute(interaction, client) {

        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');

        if (!client.config.developers.includes(interaction.user.id)) {
            return interaction.reply(client.config.ownerOnlyCommand).then(e => {
                setTimeout(() => e.delete(), 4000);
            });
        }

        if (client.config.developers.includes(interaction.user.id)) {
            user.send({ content: `${message}` }).catch(err => {
                return;
            })

            const embed = new EmbedBuilder()
            .setAuthor({ name: `Soundy` })
            .setTitle(`Direct Message Sender`)
            .setColor(client.config.embedColor)
            .setDescription(`> Your message has been sent to **${user}**`)
            .setFooter({ text: `Message sent!` })
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();
        
            interaction.reply({ embeds: [embed], ephemeral: true })
        } else {
            return interaction.reply({ content: `${client.config.ownerOnlyCommand}`, ephemeral: true })
        } 
    }
}