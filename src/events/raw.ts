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
		client.manager.sendRawData(payload as AnyPacket);
	},
});
