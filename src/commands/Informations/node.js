const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('node')
        .setDescription('Check music nodes status'),
    
    async execute(interaction, client) {
        const nodes = client.manager.nodes;
        
        // Create initial embed with all nodes
        const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle('Soundy Node Status')
            .setDescription('Select a node from the menu below to see detailed information')
            .setFooter({ text: 'Node Status Information', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Create select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('node-select')
            .setPlaceholder('Select a node to view')
            .addOptions(
                nodes.map(node => ({
                    label: node.options.identifier,
                    description: `Status: ${node.connected ? 'Connected' : 'Disconnected'}`,
                    value: node.options.identifier,
                    emoji: node.connected ? client.config.nodeOnEmoji : client.config.nodeOffEmoji
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Send initial message with select menu
        const response = await interaction.reply({
            embeds: [embed],
            components: [row]
        });

        // Create collector for select menu
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000 // Collector will be active for 1 minute
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'This menu is not for you!', ephemeral: true });
            }

            const selectedNode = nodes.find(n => n.options.identifier === i.values[0]);
            const stats = selectedNode.stats || {
                players: 0,
                playingPlayers: 0,
                uptime: 0,
                cpu: { cores: 0, systemLoad: 0, lavalinkLoad: 0 },
                memory: { used: 0, reservable: 0 },
            };

            const updatedEmbed = new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setTitle(`Node Status`)
                .addFields({
                    name: `${selectedNode.options.identifier} (${selectedNode.connected ? client.config.nodeOnEmoji : client.config.nodeOffEmoji})`,
                    value: `\`\`\`js
Players: ${stats.players}
Playing Players: ${stats.playingPlayers}
Uptime: ${formatTime(stats.uptime)}
CPU:
  Cores: ${stats.cpu.cores}
  System Load: ${(stats.cpu.systemLoad * 100).toFixed(2)}%
  Lavalink Load: ${(stats.cpu.lavalinkLoad * 100).toFixed(2)}%
Memory:
  Used: ${formatBytes(stats.memory.used)}
  Reservable: ${formatBytes(stats.memory.reservable)}
\`\`\``
                })
                .setFooter({ text: 'Node Status Information', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await i.update({ embeds: [updatedEmbed], components: [row] });
        });

        collector.on('end', () => {
            selectMenu.setDisabled(true);
            interaction.editReply({
                components: [new ActionRowBuilder().addComponents(selectMenu)]
            }).catch(() => {});
        });
    }
};

// Utility function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

// Utility function to format time
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
