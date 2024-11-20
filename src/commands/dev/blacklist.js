const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js")
const blacklistSchema = require("../../schemas/blacklistSystem")
const config = require('../../config');
const developers = config.developers;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist system for users (OWNER ONLY COMMAND)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(command => command.setName('add').setDescription('Add a user to the blacklist').addStringOption(option => option.setName("userid").setDescription("The user to add to the blacklist (MUST BE THEIR ID)").setRequired(true)).addStringOption(option => option.setName("reason").setDescription("The reason for the blacklist").setRequired(false)))
    .addSubcommand(command => command.setName('remove').setDescription('Remove a user from the blacklist').addStringOption(option => option.setName("user").setDescription("The user to remove from the blacklist (MUST BE THEIR ID)").setRequired(true))),
    async execute(interaction, client) {

        const sub = interaction.options.getSubcommand();

        if (!developers.includes(interaction.user.id)) {
            const noPermEmbed = new EmbedBuilder()
                .setColor(client.config.embedNo)
                .setTitle(`${client.config.noEmoji} No Permission`)
                .setDescription(client.config.ownerOnlyCommand)
                .setTimestamp();
            return await interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        switch (sub) {
            case "add":

            const addBlacklistUser = interaction.options.getString("userid")
            const reasonOption = interaction.options.getString("reason") || "No reason provided";

            const blacklist = await blacklistSchema.findOne({ userId: addBlacklistUser });

            if (blacklist) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(client.config.embedNo)
                    .setTitle(`${client.config.noEmoji} Already Blacklisted`)
                    .setDescription(`${addBlacklistUser} has already been blacklisted from ${client.user.username}`)
                    .setTimestamp();
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            await blacklistSchema.create({ userId: addBlacklistUser, reason: reasonOption });

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: client.user.username })
                .setTitle(`${client.config.yesEmoji} Blacklist System`)
                .setThumbnail(client.user.displayAvatarURL())
                .setColor(client.config.embedColor)
                .setDescription(`Successfully added user to blacklist`)
                .addFields(
                    { name: 'User ID', value: addBlacklistUser, inline: true },
                    { name: 'Reason', value: reasonOption, inline: true }
                )
                .setFooter({ text: `User Blacklisted from ${client.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

            break;
            case "remove":

            const removeBlacklistUser = interaction.options.getString("user")

            const userToRemove = await blacklistSchema.findOne({ userId: removeBlacklistUser });

            if (!userToRemove) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor(client.config.embedNo)
                    .setTitle(`${client.config.noEmoji} User Not Blacklisted`)
                    .setDescription(`User ${removeBlacklistUser} has not been blacklisted from using ${client.user.username}`)
                    .setTimestamp();
                return await interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
            }

            try {
                await blacklistSchema.findOneAndDelete({ userId: removeBlacklistUser })
                const removeEmbed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username })
                    .setTitle(`${client.config.yesEmoji} Blacklist System`)
                    .setDescription(`Successfully removed user from blacklist`)
                    .addFields(
                        { name: 'User ID', value: removeBlacklistUser, inline: true }
                    )
                    .setColor(client.config.embedColor)
                    .setFooter({ text: `User removed from blacklist` })
                    .setTimestamp()
                    .setThumbnail(interaction.client.user.displayAvatarURL());
                
                interaction.reply({ embeds: [removeEmbed] })
            } catch (err) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(client.config.embedNo)
                    .setTitle(`${client.config.noEmoji} Error`)
                    .setDescription(`There was an error removing the blacklist from ${removeBlacklistUser}`)
                    .setTimestamp();
                interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                client.logs.error(`[BLACKLIST_SYSTEM] There was an error removing the blacklist from ${removeBlacklistUser}`, err)
            }
        }
    }
}