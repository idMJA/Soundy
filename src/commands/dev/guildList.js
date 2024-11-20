const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const config = require('../../config');
const developers = config.developers;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("guildlist")
        .setDescription("Lists all guilds the bot is in (OWNER ONLY COMMAND).")
        .setDefaultMemberPermissions(PermissionsBitField.Administrator),
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (!developers.includes(interaction.user.id)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor(client.config.embedNo)
                    .setTitle(`${client.config.noEmoji} No Permission`)
                    .setDescription(client.config.ownerOnlyCommand)
                    .setTimestamp();
                return await interaction.editReply({ embeds: [noPermEmbed] });
            }

            const guilds = Array.from(client.guilds.cache.values());
            const pageSize = 20;
            const totalPages = Math.ceil(guilds.length / pageSize);

            const generateEmbed = (page) => {
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                const guildList = guilds.slice(start, end).map(guild => `${guild.name} (${guild.id})`).join('\n');

                return new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription(guildList)
                    .setFooter({ text: `Page ${page}/${totalPages} | Total Guilds: ${guilds.length}` });
            };

            const generateRow = (currentPage) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === totalPages)
                    );
            };

            const generateSelectMenu = () => {
                const options = [];
                for (let i = 1; i <= totalPages; i++) {
                    options.push({
                        label: `Page ${i}`,
                        value: i.toString(),
                    });
                }
                return new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select_page')
                            .setPlaceholder('Select a page')
                            .addOptions(options)
                    );
            };

            let currentPage = 1;
            const embed = generateEmbed(currentPage);
            const row = generateRow(currentPage);
            const selectMenu = generateSelectMenu();

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row, selectMenu],
            });

            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async i => {
                if (i.customId === 'previous') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                } else if (i.customId === 'select_page') {
                    currentPage = parseInt(i.values[0]);
                }

                const newEmbed = generateEmbed(currentPage);
                const newRow = generateRow(currentPage);

                await i.update({ embeds: [newEmbed], components: [newRow, selectMenu] });
            });

            collector.on('end', async () => {
                const finalEmbed = generateEmbed(currentPage);
                await interaction.editReply({ embeds: [finalEmbed], components: [] });
            });

        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(client.config.embedNo)
                .setTitle(`${client.config.noEmoji} Error`)
                .setDescription("An error occurred while executing the command.")
                .setTimestamp();
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};