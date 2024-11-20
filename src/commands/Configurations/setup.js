const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const SetupSchema = require('../../schemas/setupSystem');
const { getButtons } = require('../../events/SetupEvents/setupButtons');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Manage Soundy Control Panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels | PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild),
    
    async execute(interaction, client) {
        // Check if user has required permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            const embed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`${client.config.warnEmoji} You need Manage Channels, Manage Server, or Administrator permission to use this command.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_menu')
                    .setPlaceholder('Select an action')
                    .addOptions([
                        {
                            label: 'Create Control Panel',
                            description: 'Create a new Soundy Control Panel',
                            value: 'setup_create',
                            emoji: client.config.yesEmoji
                        },
                        {
                            label: 'Delete Control Panel',
                            description: 'Delete existing Soundy Control Panel',
                            value: 'setup_delete',
                            emoji: client.config.trashEmoji
                        }
                    ])
            );

        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Setup Control Panel')
            .setDescription('Choose an action below to manage the Soundy Control Panel');

        const response = await interaction.reply({
            embeds: [embed],
            components: [row]
        });

        const collector = response.createMessageComponentCollector({ 
            time: 60000,
            max: 1
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ 
                    content: 'This menu is not for you!', 
                    ephemeral: true 
                });
            }

            const selection = i.values[0];

            if (selection === 'setup_create') {
                const setupData = await SetupSchema.findOne({ guildId: interaction.guild.id });
                
                if (setupData) {
                    const embed = new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.warnEmoji} A Soundy control panel already exists in <#${setupData.channelId}>`);
                    return i.update({ embeds: [embed], components: [] });
                }

                const channel = await interaction.guild.channels.create({
                    name: "🎧・soundy-music",
                    type: ChannelType.GuildText,
                    topic: "Soundy Control Panel - Type a song name or URL to play music. Use /play for advanced options.",
                    permissionOverwrites: [
                        {
                            id: client.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'EmbedLinks', 'ReadMessageHistory']
                        },
                        {
                            id: interaction.guild.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });

                const setupEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.config.musicEmoji} Soundy Control Panel`)
                    .setDescription('No song is currently playing.\nJoin a voice channel and queue songs by name or url using **/play** or click the button below.')
                    .setImage(client.config.banner);

                const components = getButtons(client);
                
                // Disable all buttons initially
                components.forEach(row => {
                    row.components.forEach(button => button.setDisabled(true));
                });

                const setupMessage = await channel.send({
                    embeds: [setupEmbed],
                    components
                });

                await SetupSchema.create({
                    guildId: interaction.guild.id,
                    channelId: channel.id,
                    messageId: setupMessage.id
                });

                const successEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Successfully created the Soundy control panel in ${channel}!`);
                    
                return i.update({ embeds: [successEmbed], components: [] });

            } else if (selection === 'setup_delete') {
                const setupData = await SetupSchema.findOne({ guildId: interaction.guild.id });

                if (!setupData) {
                    const embed = new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`${client.config.warnEmoji} There is no Soundy control panel setup in this server.`);
                    return i.update({ embeds: [embed], components: [] });
                }

                try {
                    const channel = await interaction.guild.channels.fetch(setupData.channelId);
                    if (channel) {
                        await channel.delete();
                    }
                } catch (error) {
                    console.error('Error deleting channel:', error);
                }

                await SetupSchema.deleteOne({ guildId: interaction.guild.id });

                const successEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.yesEmoji} Successfully deleted the Soundy control panel!`);
                    
                return i.update({ embeds: [successEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(`${client.config.warnEmoji} Command timed out. Please try again.`);
                interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        });
    }
};