import type { Elysia } from "elysia";
import type { UsingClient } from "seyfert";
import type { Player } from "lavalink-client";
import type { ElysiaApp } from "#soundy/api";
import { serializePlayerState } from "./types";

interface WebSocketServerWithClients {
	clients?: Set<{ readyState: number; send: (msg: string) => void }>;
}

let globalAppInstance: ElysiaApp | Elysia | null = null;
let updateInterval: NodeJS.Timeout | null = null;

function getWsClients(app: Elysia | ElysiaApp) {
	const server = app.server as WebSocketServerWithClients;
	if (!server || !server.clients) {
		return null;
	}
	return server.clients;
}

export function setGlobalAppInstance(app: ElysiaApp | Elysia) {
	globalAppInstance = app;
	startAutoUpdate();
}

function startAutoUpdate() {
	if (updateInterval) {
		clearInterval(updateInterval);
	}

	updateInterval = setInterval(() => {
		if (!globalAppInstance) return;

		const clients = getWsClients(globalAppInstance);
		if (!clients || clients.size === 0) return;

		const client = (globalAppInstance as unknown as { client?: UsingClient })
			.client;
		if (!client?.manager?.players) return;

		for (const player of client.manager.players.values()) {
			if (player.connected) {
				broadcastPlayerStatus(player.guildId, player, globalAppInstance);
			}
		}
	}, 50);
}

export function stopAutoUpdate() {
	if (updateInterval) {
		clearInterval(updateInterval);
		updateInterval = null;
	}
}

function broadcastPlayerStatus(
	guildId: string,
	player: Player,
	app: ElysiaApp | Elysia,
) {
	const clients = getWsClients(app);
	if (!clients) return;

	const statusMsg = JSON.stringify({
		type: "status",
		guildId,
		...serializePlayerState(player),
		queue: player.queue.tracks.map((track, index: number) => ({
			index,
			title: track.info.title || "Unknown",
			author: track.info.author || "Unknown",
			duration: track.info.duration || 0,
			uri: track.info.uri || "",
			artwork: track.info.artworkUrl || undefined,
			requester:
				track.requester &&
				typeof track.requester === "object" &&
				"id" in track.requester
					? (track.requester as { id: string }).id
					: undefined,
		})),
		current: player.queue.current
			? {
					title: player.queue.current.info.title,
					author: player.queue.current.info.author,
					duration: player.queue.current.info.duration,
					uri: player.queue.current.info.uri,
					artwork: player.queue.current.info.artworkUrl || undefined,
					isStream: player.queue.current.info.isStream,
					position: player.position,
					requester:
						player.queue.current.requester &&
						typeof player.queue.current.requester === "object" &&
						"id" in player.queue.current.requester
							? (player.queue.current.requester as { id: string }).id
							: undefined,
				}
			: null,
		position: player.position,
		volume: player.volume,
		paused: player.paused,
		playing: player.playing,
		repeatMode: player.repeatMode,
		autoplay: player.get("enabledAutoplay") || false,
		connected: player.connected ?? false,
	});

	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(statusMsg);
		}
	}
}

export function broadcastPlayerUpdate(guildId: string, player: Player) {
	if (globalAppInstance) {
		broadcastPlayerStatus(guildId, player, globalAppInstance);
	}
}

export function broadcastPlayerEvent(
	guildId: string,
	player: Player,
	eventType: string,
	eventData?: unknown,
) {
	if (!globalAppInstance) return;

	const clients = getWsClients(globalAppInstance);
	if (!clients) return;

	const eventMsg = JSON.stringify({
		type: "player-event",
		eventType,
		guildId,
		...serializePlayerState(player),
		eventData,
		timestamp: Date.now(),
	});

	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(eventMsg);
		}
	}
}

export function broadcastPlayerDisconnection(guildId: string) {
	if (!globalAppInstance) return;

	const clients = getWsClients(globalAppInstance);
	if (!clients) return;

	const disconnectionMsg = JSON.stringify({
		type: "status",
		guildId,
		connected: false,
		playing: false,
		paused: false,
		volume: 0,
		position: 0,
		current: null,
		queue: [],
		repeatMode: 0,
		autoplay: false,
	});

	for (const client of clients) {
		if (client.readyState === 1) {
			client.send(disconnectionMsg);
		}
	}
}
