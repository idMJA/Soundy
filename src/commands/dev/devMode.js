const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const modeFilePath = path.resolve(__dirname, '../../mode.js');
const config = require('../../config');
const developers = config.developers;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('devmode')
        .setDescription('Manage Development Mode.'),

    async execute(interaction, client) {
        if (!developers.includes(interaction.user.id)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setAuthor({ name: client.user.username })
                .setColor(client.config.embedNo)
                .setTitle(`${client.config.noEmoji} No Permission`)
                .setDescription('You do not have permission to use this command.')
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();
            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('enable_devmode')
                    .setLabel('Enable')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(client.config.yesEmoji),
                new ButtonBuilder()
                    .setCustomId('disable_devmode')
                    .setLabel('Disable')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.config.noEmoji),
                new ButtonBuilder()
                    .setCustomId('check_devmode')
                    .setLabel('Check Status')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(client.config.infoEmoji),
                new ButtonBuilder()
                    .setCustomId('delete_message')
                    .setLabel('Delete')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.config.trashEmoji),
                new ButtonBuilder()
                    .setCustomId('back_to_main')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.config.homeEmoji)
            );

        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user.username })
            .setTitle(`${client.config.slashEmoji} Development Mode`)
            .setDescription(`> ${client.config.infoEmoji} Choose an action for Development Mode.`)
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: `${client.config.pencilEmoji} Note | EN`, value: `> Use Start "npm run dev" before running this command.` },
                { name: `${client.config.pencilEmoji} Catatan | ID`, value: `> Gunakan Start "npm run dev" sebelum menjalankan command ini.` },
                { name: `${client.config.pencilEmoji} リマインダー | JP`, value: `> このコマンドを実行する前に 「npm run dev 」を開始してください。` }
            )
            .setColor(client.config.embedColor)
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
            }

            if (i.customId === 'delete_message') {
                await message.delete();
                return;
            }

            if (i.customId === 'back_to_main') {
                await i.update({ embeds: [embed], components: [row] });
                return;
            }

            if (i.customId === 'check_devmode') {
                try {
                    let data = await fs.readFile(modeFilePath, 'utf-8');
                    const devModeStatus = data.includes('devMode: true');
                    const statusEmbed = new EmbedBuilder()
                        .setAuthor({ name: client.user.username })
                        .setTitle(`${client.config.slashEmoji} Development Mode Status`)
                        .setDescription(`> ${client.config.stormEmoji} Development mode is currently ${devModeStatus ? `${client.config.yesEmoji} **Enabled**` : `${client.config.noEmoji} **Disabled**`}.`)
                        .setColor(client.config.embedColor)
                        .setFooter({ 
                            text: `Requested by ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                        })
                        .setTimestamp();
                    await i.update({ embeds: [statusEmbed], components: [row] });
                    return;
                } catch (error) {
                    console.error('Error occurred:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setAuthor({ name: client.user.username })
                        .setTitle(`${client.config.noEmoji} Error`)
                        .setDescription(`> ${client.config.stormEmoji} An error occurred while checking the development mode status.`)
                        .setColor(client.config.embedNo)
                        .setFooter({ 
                            text: `Requested by ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                        })
                        .setTimestamp();
                    await i.update({ embeds: [errorEmbed], components: [] });
                    return;
                }
            }

            const devModeStatus = i.customId === 'enable_devmode';

            try {
                let data = await fs.readFile(modeFilePath, 'utf-8');
                let updatedData = data.replace(/devMode:\s*(true|false)/, `devMode: ${devModeStatus}`);
                await fs.writeFile(modeFilePath, updatedData);

                const successEmbed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username })
                    .setTitle(`${client.config.slashEmoji} Development Mode`)
                    .setDescription(`> ${client.config.stormEmoji} Development mode has been ${devModeStatus ? `${client.config.yesEmoji} **Enabled**` : `${client.config.noEmoji} **Disabled**`}.`)
                    .setColor(client.config.embedColor)
                    .setFooter({ 
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp();

                await i.update({ embeds: [successEmbed], components: [row] });
            } catch (error) {
                console.error('Error occurred:', error);
                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username })
                    .setTitle(`${client.config.noEmoji} Error`)
                    .setDescription(`> ${client.config.stormEmoji} An error occurred while updating the development mode status.`)
                    .setColor(client.config.embedNo)
                    .setFooter({ 
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp();
                await i.update({ embeds: [errorEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ components: [] });
            }
        });
    }
};