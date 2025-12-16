import type { UsingClient } from "seyfert";
import type { ElysiaApp, SoundyWS, WSMessage } from "#soundy/api";
import type { PlayerSaver } from "#soundy/utils";
import { handleRepeat, handleShuffle, handleVolume } from "./controls";
import {
	handleGetPlaylist,
	handleGetPlaylists,
	handleUserConnect,
	handleUserStatus,
} from "./misc";
import {
	handlePause,
	handlePrevious,
	handleResume,
	handleSeek,
	handleSkip,
	handleStatus,
	handleStop,
} from "./player";
import { handleLoadPlaylist, handleUserPlaylists } from "./playlist";
import { handleClear, handlePlay, handleQueue, handleRemove } from "./queue";
import { getContext, getRequesterId, serializePlayerState } from "./types";

interface WSWithInterval extends SoundyWS {
	updateInterval?: NodeJS.Timeout;
}

export function setupSoundyWebSocket(
	app: ElysiaApp,
	client: UsingClient,
	playerSaver: PlayerSaver,
): void {
	app.ws("/ws", {
		message: async (ws: SoundyWS, data: unknown) => {
			let msg: WSMessage;
			try {
				msg = typeof data === "string" ? JSON.parse(data) : (data as WSMessage);
			} catch {
				ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}

			if (!ws.store) ws.store = {};
			if (!ws.data) ws.data = ws.store;

			await handleStatus(ws, msg, client);
			await handlePause(ws, msg, client);
			await handleResume(ws, msg, client);
			await handleSkip(ws, msg, client);
			await handleStop(ws, msg, client);
			await handleSeek(ws, msg, client);
			await handlePrevious(ws, msg, client);
			await handleVolume(ws, msg, client);
			await handleShuffle(ws, msg, client);
			await handleRepeat(ws, msg, client, playerSaver);
			await handleQueue(ws, msg, client);
			await handleClear(ws, msg, client);
			await handleRemove(ws, msg, client);
			await handlePlay(ws, msg, client);
			await handleLoadPlaylist(ws, msg, client);
			await handleUserPlaylists(ws, msg, client);
			await handleUserConnect(ws, msg, client, playerSaver);
			await handleGetPlaylist(ws, msg, client);
			await handleGetPlaylists(ws, msg, client);
			await handleUserStatus(ws, msg, client);

			if (msg.guildId) {
				const player = client.manager.getPlayer(msg.guildId);
				if (player) {
					const playerData = {
						guildId: player.guildId,
						voiceChannelId: player.voiceChannelId || undefined,
						textChannelId: player.textChannelId || undefined,
						volume: player.volume,
						repeatMode: player.repeatMode,
						position: player.position,
						connected: player.connected,
						playing: player.playing,
						paused: player.paused,
						autoplay: player.get("enabledAutoplay") || false,
					};
					await playerSaver.savePlayer(player.guildId, playerData);
				}
			}
		},

		open: (ws: WSWithInterval) => {
			client.logger.info("[WebSocket] Client connected");

			ws.send(
				JSON.stringify({
					type: "hello",
					message: "Welcome to Soundy WebSocket!",
				}),
			);

			const updateInterval = setInterval(() => {
				try {
					const guildId = ws.store?.guildId ?? ws.data?.guildId;
					if (guildId) {
						const player = client.manager.getPlayer(guildId);
						if (player?.connected && player.playing) {
							const state = serializePlayerState(player);
							ws.send(
								JSON.stringify({
									type: "auto-update",
									...state,
								}),
							);
						}
					}
				} catch (error) {
					client.logger.error("[WebSocket] Auto-update error:", error);
				}
			}, 50);

			ws.updateInterval = updateInterval;
		},

		close: (ws: WSWithInterval) => {
			client.logger.info("[WebSocket] Client disconnected");

			if (ws.updateInterval) {
				clearInterval(ws.updateInterval);
			}
		},
	});
}

export { serializePlayerState, getContext, getRequesterId };
export {
	broadcastPlayerDisconnection,
	broadcastPlayerEvent,
	broadcastPlayerUpdate,
	setGlobalAppInstance,
	stopAutoUpdate,
} from "./broadcast";
