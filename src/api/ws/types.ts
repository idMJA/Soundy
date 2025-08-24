import type { SoundyWS, WSMessage } from "#soundy/api";
import type { UsingClient } from "seyfert";
import type { Player } from "lavalink-client";

export interface WebSocketServerWithClients {
	clients?: Set<{ readyState: number; send: (msg: string) => void }>;
}

export type WSHandler = (
	ws: SoundyWS,
	msg: WSMessage,
	client: UsingClient,
) => Promise<void> | void;

export function serializePlayerState(player: Player) {
	const current = player.queue.current;
	return {
		connected: player.connected ?? false,
		playing: player.playing,
		paused: player.paused,
		volume: player.volume,
		position: player.position,
		current: current
			? {
					title: current.info.title,
					author: current.info.author,
					duration: current.info.duration,
					uri: current.info.uri,
					artwork: current.info.artworkUrl || undefined,
					isStream: current.info.isStream,
					position: player.position,
					albumName: current.pluginInfo.albumName,
				}
			: null,
		repeatMode:
			player.repeatMode === "off" ? 0 : player.repeatMode === "track" ? 1 : 2,
		autoplay: player.get("enabledAutoplay") || false,
	};
}

export function getContext(msg: WSMessage, ws: SoundyWS) {
	return {
		guildId: msg.guildId || ws.store?.guildId,
		voiceChannelId: msg.voiceChannelId || ws.store?.voiceChannelId,
	};
}

export function getRequesterId(msg: WSMessage, ws: SoundyWS) {
	return String(msg.userId || ws.store?.userId || "websocket-user");
}
