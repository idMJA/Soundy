import type { Elysia } from "elysia";
import type { UsingClient } from "seyfert";
import type { PlayerSaver } from "#soundy/utils";
import type { SoundyWS, WSMessage } from "#soundy/api";
import { serializePlayerState, getContext, getRequesterId } from "./types";

import {
	handleStatus,
	handlePause,
	handleResume,
	handleSkip,
	handleStop,
	handleSeek,
	handlePrevious,
} from "./player";
import { handleVolume, handleShuffle, handleRepeat } from "./controls";
import { handleQueue, handleClear, handleRemove, handlePlay } from "./queue";
import { handleLoadPlaylist, handleUserPlaylists } from "./playlist";
import {
	handleUserConnect,
	handleGetPlaylist,
	handleGetPlaylists,
	handleUserStatus,
} from "./misc";

interface WSWithInterval extends SoundyWS {
	updateInterval?: NodeJS.Timeout;
}

export function setupSoundyWebSocket(
	app: Elysia,
	client: UsingClient,
	playerSaver: PlayerSaver,
) {
	(app as unknown as { client: UsingClient }).client = client;

	return app.ws("/ws", {
		message: async (ws: SoundyWS, data: unknown) => {
			let msg: WSMessage;
			try {
				msg = typeof data === "string" ? JSON.parse(data) : (data as WSMessage);
			} catch {
				ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}

			if (!ws.store) ws.store = {};

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
					if (ws.store?.guildId) {
						const player = client.manager.getPlayer(ws.store.guildId);
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
	setGlobalAppInstance,
	stopAutoUpdate,
	broadcastPlayerUpdate,
	broadcastPlayerEvent,
	broadcastPlayerDisconnection,
} from "./broadcast";
