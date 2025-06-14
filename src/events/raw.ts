import type {
	ChannelDeletePacket,
	VoicePacket,
	VoiceServer,
	VoiceState,
} from "lavalink-client";
import { createEvent } from "seyfert";

type AnyPacket = VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket;

export default createEvent({
	data: { once: false, name: "raw" },
	async run(payload, client) {
		// {
		//     t: 'VOICE_SERVER_UPDATE',
		//     s: 5,
		//     op: 0,
		//     d: {
		//       token: '46c2de6b5bb8b7f0',
		//       guild_id: '684551832793776128',
		//       endpoint: 'us-south1387.discord.media:443'
		//     }
		//   }

		client.manager.sendRawData(payload as AnyPacket);
	},
});
