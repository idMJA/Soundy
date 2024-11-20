const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        // Ensure client.logs is defined
        if (!client.logs) {
            client.logs = {
                info: console.log,
                success: console.log,
                error: console.error,
            };
        }

        // Set static presence
        client.user.setPresence({ 
            activities: [{ 
                name: `/help | @${client.user.username}`, 
                type: ActivityType[client.config.activityType] || ActivityType.Listening 
            }],
            status: client.config.status || 'idle'
        });

        client.logs.success(`[STATUS] Bot status set successfully.`);
    }
};