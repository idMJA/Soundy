const { ClusterManager } = require('discord-hybrid-sharding');
const path = require('path');
const logs = require('./utils/logs.js');
require('dotenv').config();

const manager = new ClusterManager(path.join(__dirname, 'soundy.js'), {
    totalShards: 'auto',
    shardsPerClusters: 2,
    mode: 'process',
    token: process.env.TOKEN
});

manager.on('clusterCreate', async (cluster) => {
    logs.success(`Launched Cluster ${cluster.id}`);
});

manager.spawn({ timeout: -1 });