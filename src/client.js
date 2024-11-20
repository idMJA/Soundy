const { Manager } = require('magmastream');
const nodes = require('./config/nodes');

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

    manager.on('nodeConnect', (node) => {
        client.logs.success(`Node ${node.options.identifier} connected successfully`);
    });

    manager.on('nodeError', (node, error) => {
        client.logs.error(`Node ${node.options.identifier} encountered an error:`, error);
    });

    manager.on('nodeDisconnect', (node, reason) => {
        client.logs.warn(`Lavalink ${node.options.identifier}: Closed, Code ${reason.code}, Reason ${reason.reason || 'No reason'}`);
    });

    manager.on('playerDestroy', (player) => {
        client.logs.warn(`Player destroyed in guild ${player.guild}`);
    });

    manager.on('queueEnd', (player) => {
        client.logs.info(`Queue ended in guild ${player.guild}`);
    });

    manager.on('trackError', (player, track, payload) => {
        client.logs.error(`Track error in guild ${player.guild}:`, payload.error);
    });

    return manager;
};
