import crypto from "node:crypto";
import type { UsingClient } from "seyfert";
import type { ElysiaApp, SoundyWS, WSMessage } from "#soundy/api";
import type { PlayerSaver } from "#soundy/utils";
import { handleRepeat, handleShuffle, handleVolume } from "./controls";
import {
	handleGetPlaylist,
	handleGetPlaylists,
	handleSelectGuild,
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

			if (!ws.data) ws.data = {};

			// Rate limiter guard (max 15 messages per second per client)
			const now = Date.now();
			if (!ws.data.msgWindowStart || now - ws.data.msgWindowStart > 1000) {
				ws.data.msgWindowStart = now;
				ws.data.msgCount = 1;
			} else {
				ws.data.msgCount = (ws.data.msgCount || 0) + 1;
				if (ws.data.msgCount > 15) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Rate limit exceeded. Please slow down.",
						}),
					);
					return;
				}
			}

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
			await handleSelectGuild(ws, msg, client);

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
						autoplay: player.getData("enabledAutoplay") || false,
					};
					await playerSaver.savePlayer(player.guildId, playerData);
				}
			}
		},

		open: (ws: SoundyWS) => {
			client.logger.info("[WebSocket] Client connected");

			const query = (ws.data as { query?: Record<string, string> })?.query;
			const token = query?.token;

			if (!token) {
				client.logger.warn("[WebSocket] Connection rejected: Missing token");
				ws.send(
					JSON.stringify({
						type: "error",
						message: "Unauthorized: Missing token",
					}),
				);
				ws.close?.();
				return;
			}

			try {
				const parts = token.split(".");
				if (parts.length !== 2) {
					throw new Error("Invalid token format");
				}

				const [base64Data, signature] = parts;
				if (!base64Data || !signature) {
					throw new Error("Token components missing");
				}

				const secret = process.env.JWT_SECRET;
				if (!secret) {
					throw new Error("JWT_SECRET environment variable is not configured");
				}
				const expectedSignature = crypto
					.createHmac("sha256", secret)
					.update(base64Data)
					.digest("base64url");

				if (signature !== expectedSignature) {
					throw new Error("Invalid token signature");
				}

				const userJson = Buffer.from(base64Data, "base64url").toString("utf-8");
				const user = JSON.parse(userJson);

				if (!ws.data) ws.data = {};
				ws.data.userId = user.id;

				client.logger.info(
					`[WebSocket] Client authenticated for user ${user.username} (${user.id})`,
				);

				// Start periodic verification check
				const verifyInterval = setInterval(async () => {
					const uid = ws.data?.userId;
					const gid = ws.data?.guildId;
					if (uid && gid) {
						const isMember =
							client.cache.members?.get(uid, gid) ||
							(await client.members.fetch(gid, uid).catch(() => null));
						if (!isMember) {
							client.logger.warn(
								`[WebSocket] Client kicked: User ${uid} is no longer a member of guild ${gid}`,
							);
							ws.send(
								JSON.stringify({
									type: "error",
									message: "Unauthorized: You have left this server.",
								}),
							);
							ws.close?.();
						}
					}
				}, 5000);

				(
					ws as unknown as { _verifyInterval: ReturnType<typeof setInterval> }
				)._verifyInterval = verifyInterval;

				ws.send(
					JSON.stringify({
						type: "hello",
						message: "Welcome to Soundy WebSocket!",
					}),
				);
			} catch (err) {
				client.logger.error(
					`[WebSocket] Connection rejected: ${err instanceof Error ? err.message : String(err)}`,
				);
				ws.send(
					JSON.stringify({
						type: "error",
						message: "Unauthorized: Invalid token",
					}),
				);
				ws.close?.();
			}
		},

		close: (ws: SoundyWS) => {
			client.logger.info("[WebSocket] Client disconnected");
			const socket = ws as unknown as {
				_verifyInterval?: ReturnType<typeof setInterval>;
			};
			if (socket._verifyInterval) {
				clearInterval(socket._verifyInterval);
			}
		},
	});
}

export {
	broadcastPlayerDisconnection,
	broadcastPlayerEvent,
	broadcastPlayerUpdate,
	broadcastUserVoiceStateUpdate,
	setGlobalAppInstance,
} from "./broadcast";
export { getContext, getRequesterId, serializePlayerState };
