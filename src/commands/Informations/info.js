const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays detailed bot information.'),
        
    async execute(interaction, client) {
        try {
            // Calculate bot uptime
            const totalSeconds = (client.uptime / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);

            // Calculate memory usage
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;

            // Create main menu embed
            const mainEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle('Soundy Info Menu')
                .setDescription(`**Hello!** <@${interaction.user.id}>, **Welcome to the Info Menu!** ${client.config.infoEmoji}\n\n` +
                    `**Here you can find detailed information about Soundy's various aspects:**\n\n` +
                    `${client.config.userEmoji} : **Client Information**\n` +
                    `${client.config.globeEmoji} : **Statistics**\n` +
                    `${client.config.clockEmoji} : **System Information**\n` + 
                    `${client.config.infoEmoji} : **All Information**\n\n` +
                    `**Select A Category From The Menu Below.**\n\n` +
                    `**[Invite Me](${client.config.botInvite}) • [Support Server](${client.config.botServerInvite}) • [Vote](${client.config.voteLink})**`)
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: 'Thanks for choosing Soundy!' })
                .setTimestamp();

            // Create different embeds for each category
            const clientEmbed = new EmbedBuilder()
                .setTitle(`${client.config.userEmoji} Client Information`)
                .setColor(client.config.embedColor)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: 'Username', value: `\`\`\`py\n${client.user.tag}\`\`\``, inline: true },
                    { name: 'Bot Version', value: `\`\`\`js\n${client.config.botVersion}\`\`\``, inline: true },
                    { name: 'API Latency', value: `\`\`\`c\n${client.ws.ping}ms\`\`\``, inline: true },
                    { name: 'Response Time', value: `\`\`\`c\n${Date.now() - interaction.createdTimestamp}ms\`\`\``, inline: true },
                    { name: 'Uptime', value: `\`\`\`c\n${days}d ${hours}h ${minutes}m ${seconds}s\`\`\``, inline: true },
                    { name: 'Discord.js', value: `\`\`\`js\n${require('discord.js').version}\`\`\``, inline: true }
                )
                .setTimestamp();

            const statsEmbed = new EmbedBuilder()
                .setTitle(`${client.config.globeEmoji} Statistics`)
                .setColor(client.config.embedColor)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: 'Server Count', value: `\`\`\`js\n${client.guilds.cache.size}\`\`\``, inline: true },
                    { name: 'User Count', value: `\`\`\`js\n${client.users.cache.size}\`\`\``, inline: true },
                    { name: 'Channel Count', value: `\`\`\`js\n${client.channels.cache.size}\`\`\``, inline: true },
                    { name: 'Command Count', value: `\`\`\`js\n${client.commands.size}\`\`\``, inline: true }
                )
                .setTimestamp();

            const systemEmbed = new EmbedBuilder()
                .setTitle(`${client.config.clockEmoji} System Information`)
                .setColor(client.config.embedColor)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: 'OS', value: `\`\`\`js\n${os.type()} ${os.release()} (${os.arch()})\`\`\``, inline: true },
                    { name: 'CPU', value: `\`\`\`js\n${os.cpus()[0].model}\`\`\``, inline: true },
                    { name: 'vCore', value: `\`\`\`js\n${os.cpus().length}\`\`\``, inline: true },
                    { name: 'RAM', value: `\`\`\`js\n${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB\`\`\``, inline: true },
                    { name: 'Memory Usage', value: `\`\`\`py\n${(usedMemory / 1024 / 1024).toFixed(2)} MB / ${(totalMemory / 1024 / 1024).toFixed(2)} MB\`\`\``, inline: true },
                    { name: 'Node.js', value: `\`\`\`js\n${process.version}\`\`\``, inline: true },
                    { name: 'System Uptime', value: `\`\`\`c\n${Math.floor(os.uptime() / 86400)}d ${Math.floor((os.uptime() % 86400) / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m ${Math.floor(os.uptime() % 60)}s\`\`\``, inline: true }
                )
                .setTimestamp();

            const allEmbed = new EmbedBuilder()
                .setTitle(`${client.config.infoEmoji} Bot Information`)
                .setColor(client.config.embedColor)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription('\u200B')
                .addFields(
                    { name: `${client.config.userEmoji} Client`, value: '\u200B' },
                    { name: 'Username', value: `\`\`\`py\n${client.user.tag}\`\`\``, inline: true },
                    { name: 'Bot Version', value: `\`\`\`js\n${client.config.botVersion}\`\`\``, inline: true },
                    { name: 'API Latency', value: `\`\`\`c\n${client.ws.ping}ms\`\`\``, inline: true },
                    { name: 'Response Time', value: `\`\`\`c\n${Date.now() - interaction.createdTimestamp}ms\`\`\``, inline: true },
                    { name: 'Uptime', value: `\`\`\`c\n${days}d ${hours}h ${minutes}m ${seconds}s\`\`\``, inline: true },
                    { name: 'Discord.js', value: `\`\`\`js\n${require('discord.js').version}\`\`\``, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: `${client.config.globeEmoji} Statistic`, value: '\u200B' },
                    { name: 'Server Count', value: `\`\`\`js\n${client.guilds.cache.size}\`\`\``, inline: true },
                    { name: 'User Count', value: `\`\`\`js\n${client.users.cache.size}\`\`\``, inline: true },
                    { name: 'Channel Count', value: `\`\`\`js\n${client.channels.cache.size}\`\`\``, inline: true },
                    { name: 'Command Count', value: `\`\`\`js\n${client.commands.size}\`\`\``, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: `${client.config.clockEmoji} System`, value: '\u200B' },
                    { name: 'OS', value: `\`\`\`js\n${os.type()} ${os.release()} (${os.arch()})\`\`\``, inline: true },
                    { name: 'CPU', value: `\`\`\`js\n${os.cpus()[0].model}\`\`\``, inline: true },
                    { name: 'vCore', value: `\`\`\`js\n${os.cpus().length}\`\`\``, inline: true },
                    { name: 'RAM', value: `\`\`\`js\n${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB\`\`\``, inline: true },
                    { name: 'Memory Usage', value: `\`\`\`py\n${(usedMemory / 1024 / 1024).toFixed(2)} MB / ${(totalMemory / 1024 / 1024).toFixed(2)} MB\`\`\``, inline: true },
                    { name: 'Node.js', value: `\`\`\`js\n${process.version}\`\`\``, inline: true },
                    { name: 'System Uptime', value: `\`\`\`c\n${Math.floor(os.uptime() / 86400)}d ${Math.floor((os.uptime() % 86400) / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m ${Math.floor(os.uptime() % 60)}s\`\`\``, inline: true }
                )
                .setTimestamp();

            // Create select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('info_select')
                .setPlaceholder('Select an information category')
                .addOptions([
                    {
                        label: 'Main Menu',
                        description: 'Return to the main menu',
                        value: 'main_menu',
                        emoji: client.config.homeEmoji
                    },
                    {
                        label: 'Client Information',
                        description: 'View bot client information',
                        value: 'client_info',
                        emoji: client.config.userEmoji
                    },
                    {
                        label: 'Statistics',
                        description: 'View bot statistics',
                        value: 'stats_info',
                        emoji: client.config.globeEmoji
                    },
                    {
                        label: 'System Information',
                        description: 'View system information',
                        value: 'system_info',
                        emoji: client.config.clockEmoji
                    },
                    {
                        label: 'All Information',
                        description: 'View all bot information',
                        value: 'all_info',
                        emoji: client.config.infoEmoji
                    }
                ]);

            const row = new ActionRowBuilder()
                .addComponents(selectMenu);

            const response = await interaction.reply({ 
                embeds: [mainEmbed], 
                components: [row] 
            });

            // Create collector with 2 minute timeout
            const collector = response.createMessageComponentCollector({ 
                time: 120000 // 2 minutes in milliseconds
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ 
                        content: 'This menu is not for you!', 
                        ephemeral: true 
                    });
                }

                // Reset collector timer on each interaction
                collector.resetTimer();

                switch (i.values[0]) {
                    case 'main_menu':
                        await i.update({ embeds: [mainEmbed], components: [row] });
                        break;
                    case 'client_info':
                        await i.update({ embeds: [clientEmbed], components: [row] });
                        break;
                    case 'stats_info':
                        await i.update({ embeds: [statsEmbed], components: [row] });
                        break;
                    case 'system_info':
                        await i.update({ embeds: [systemEmbed], components: [row] });
                        break;
                    case 'all_info':
                        await i.update({ embeds: [allEmbed], components: [row] });
                        break;
                }
            });

            collector.on('end', async () => {
                // Disable the select menu
                selectMenu.setDisabled(true);
                row.components[0] = selectMenu;

                // Update the message with main embed and disabled menu
                await interaction.editReply({ 
                    embeds: [mainEmbed], 
                    components: [row],
                    content: '```Menu has timed out! Use /info to start a new session.```'
                }).catch(() => {});
            });

        } catch (error) {
            console.error('Error executing info command:', error);
            return await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setDescription('An error occurred while fetching bot information. Please try again later.')],
                ephemeral: true 
            });
        }
    }
};
