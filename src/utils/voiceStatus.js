const updateVoiceStatus = async (client, player, track) => {
    try {
        // If player is null/undefined or track is null, clear the status
        if (!player || !track) {
            // Get the voice channel from player if available
            const voiceChannel = player?.voiceChannel;
            if (voiceChannel) {
                await client.rest.put(`/channels/${voiceChannel}/voice-status`, {
                    body: {
                        status: null
                    }
                });
            }
            return;
        }

        // Set status for active track
        const voiceChannel = player.voiceChannel;
        if (!voiceChannel) return;

        await client.rest.put(`/channels/${voiceChannel}/voice-status`, {
            body: {
                status: `♪ ${track.title} by ${track.author}`
            }
        });
    } catch (error) {
        client.logs.error(`Failed to update voice status: ${error.message}`);
    }
};

module.exports = { updateVoiceStatus }; 