const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get information on our bot commands and features.'),

    async execute(interaction, client) {
        if (interaction.user.id !== interaction.member.id) {
            return await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription('I apologize, but this command is intended for the user who initiated it. Please use your own help command. Thank you for your understanding.')],
                ephemeral: true 
            });
        }

        try {
            const commandFolders = fs.readdirSync('./src/commands')
                .filter(folder => !folder.startsWith('.') && folder !== 'dev');
            const commandsByCategory = {};

            for (const folder of commandFolders) {
                const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
                const commands = [];

                for (const file of commandFiles) {
                    const command = require(`../${folder}/${file}`);
                    commands.push({ name: command.data.name, description: command.data.description });
                }

                commandsByCategory[folder] = commands;
            }

            const dropdownOptions = [
                {
                    label: 'Main Menu',
                    value: 'main_menu'
                },
                ...Object.keys(commandsByCategory).map(folder => ({
                    label: folder,
                    value: folder
                }))
            ];

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('category-select')
                .setPlaceholder('Click Me!')
                .addOptions(dropdownOptions.map(option => ({
                    label: option.label,
                    value: option.value
                })));

            const mainEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Soundy Help Menu')
                .setDescription(`**Haii!** ${client.config.partyEmoji} <@${interaction.user.id}>, **I'm** <@${client.user.id}>, **your musical companion!** ${client.config.musicEmoji}\n\n` +
                    `**Soundy is a music bot designed to provide an amazing music listening experience on Discord. With its comprehensive and easy-to-use features, Soundy is the perfect choice for your Discord server.**\n\n` +
                    `${client.config.homeEmoji} : **Configurations**\n` +
                    `${client.config.slashEmoji} : **Devs**\n` +
                    `${client.config.pencilEmoji} : **Filters**\n` + 
                    `${client.config.infoEmoji} : **Help**\n` +
                    `${client.config.musicEmoji} : **Music**\n` +
                    `${client.config.listEmoji} : **Playlists**\n\n` +
                    `**Select A Category From The Menu Below.**\n\n` +
                    `**[Invite Me](${client.config.inviteLink}) • [Support Server](${client.config.supportLink}) • [Vote](${client.config.voteLink})**`)
                .setImage(client.config.banner)
                .setFooter({ text: 'Thanks for choosing Soundy!' });

            const row = new ActionRowBuilder()
                .addComponents(selectMenu);

            await interaction.reply({ embeds: [mainEmbed], components: [row] });

            const filter = i => i.isStringSelectMenu() && i.customId === 'category-select';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return await i.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(client.config.embedColor)
                            .setDescription('I apologize, but this menu is intended for the user who initiated it. Please use your own help command. Thank you for your understanding.')],
                        ephemeral: true 
                    });
                }

                if (i.values[0] === 'main_menu') {
                    await i.update({ embeds: [mainEmbed] });
                } else {
                    const selectedCategory = i.values[0];
                    const categoryCommands = commandsByCategory[selectedCategory];
                    
                    // Split commands into chunks of 10
                    const commandChunks = [];
                    for (let i = 0; i < categoryCommands.length; i += 10) {
                        commandChunks.push(categoryCommands.slice(i, i + 10));
                    }

                    // Create an embed for each chunk
                    const categoryEmbeds = commandChunks.map((chunk, index) => {
                        return new EmbedBuilder()
                            .setColor(client.config.embedColor)
                            .setTitle(`${selectedCategory} Commands ${commandChunks.length > 1 ? `(Page ${index + 1}/${commandChunks.length})` : ''}`)
                            .setDescription('List of available commands in this category:')
                            .addFields(chunk.map(command => ({
                                name: `/${command.name}`,
                                value: `\`\`\`${command.description}\`\`\``
                            })));
                    });

                    await i.update({ embeds: categoryEmbeds });
                }
            });

            collector.on('end', async () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(selectMenu.setDisabled(true));

                await interaction.editReply({ embeds: [mainEmbed], components: [disabledRow] });
            });
        } catch (error) {
            console.error('Error executing help command:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(client.config.embedColor)
                        .setDescription(`Oops! It seems like I encountered an error while trying to help you. \nMy circuits might be a bit overloaded right now. \nCould you please try again later? If the problem persists, \nplease let my creators know. Gomen nasai! 🙇‍♀️`)],
                    ephemeral: true 
                });
            }
        }
    }
};