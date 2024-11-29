const { Manager } = require('magmastream');
const nodes = require('./config/nodes');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    const manager = new Manager({
        nodes,
        send: (id, payload) => {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
        clientName: `Soundy v3 (https://github.com/idMJA/Soundy)`,
        defaultSearchPlatform: client.config.searchPlatform,
        useNode: 'leastLoad',
        reconnectTimeout: 5000,
        reconnectTries: 3
    });

    // Function to send node logs to Discord
    const sendNodeLog = async (embed) => {
        const channel = client.channels.cache.get(client.config.nodeLogsChannel);
        if (channel) {
            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                client.logs.error(`Failed to send node log to Discord: ${error}`);
            }
        }
    };

    manager.on('nodeConnect', (node) => {
        client.logs.success(`Node ${node.options.identifier} connected successfully`);
        
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🟢 Node Connected')
            .setDescription(`Node \`${node.options.identifier}\` has successfully connected.`)
            .addFields(
                { name: 'Host', value: `\`${node.options.host}\`` },
            )
            .setTimestamp();
            
        sendNodeLog(embed);
    });

    manager.on('nodeError', (node, error) => {
        client.logs.error(`Node ${node.options.identifier} encountered an error:`, error);
        
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔴 Node Error')
            .setDescription(`Node \`${node.options.identifier}\` encountered an error.`)
            .addFields(
                { name: 'Host', value: `\`${node.options.host}\`` },
                { name: 'Error', value: `\`\`\`${error.message || 'Unknown error'}\`\`\`` }
            )
            .setTimestamp();
            
        sendNodeLog(embed);
    });

    manager.on('nodeDisconnect', (node, reason) => {
        client.logs.warn(`Lavalink ${node.options.identifier}: Closed, Code ${reason.code}, Reason ${reason.reason || 'No reason'}`);
        
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('🟡 Node Disconnected')
            .setDescription(`Node \`${node.options.identifier}\` has disconnected.`)
            .addFields(
                { name: 'Host', value: `\`${node.options.host}\`` },
                { name: 'Code', value: `\`${reason.code}\`` },
                { name: 'Reason', value: `\`${reason.reason || 'No reason provided'}\`` }
            )
            .setTimestamp();
            
        sendNodeLog(embed);
    });

    manager.on('nodeReconnect', (node) => {
        client.logs.info(`Node ${node.options.identifier} is attempting to reconnect...`);
        
        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('🟠 Node Reconnecting')
            .setDescription(`Node \`${node.options.identifier}\` is attempting to reconnect.`)
            .addFields(
                { name: 'Host', value: `\`${node.options.host}\`` },
            )
            .setTimestamp();
            
        sendNodeLog(embed);
    });

    manager.on('playerDestroy', (player) => {
        client.logs.warn(`Player destroyed in guild ${player.guild}`);
    });

    manager.on('queueEnd', (player) => {
        client.logs.info(`Queue ended in guild ${player.guild}`);
    });

    manager.on('trackError', (player, track, payload) => {
        client.logs.error(`Track error in guild ${player.guild}:`, payload.error);
        
        // Get guild name from client
        const guild = client.guilds.cache.get(player.guild);
        const guildName = guild ? guild.name : 'Unknown Server';
        
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔴 Track Error')
            .setDescription(`A track error occurred in server \`${guildName}\` (ID: \`${player.guild}\`).`)
            .addFields(
                { name: 'Track', value: `\`${track.title}\`` },
                { name: 'Author', value: `\`${track.author}\`` },
                { name: 'Error', value: `\`\`\`${payload.exception?.message || payload.error || 'Unknown error'}\`\`\`` }
            )
            .setTimestamp();
            
        sendNodeLog(embed);
    });

    return manager;
};
