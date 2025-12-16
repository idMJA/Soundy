import {
	LavalinkManager,
	type SearchPlatform,
	type SearchResult,
} from "lavalink-client";
import { Logger } from "seyfert";
import type Soundy from "#soundy/client";
import { nodes } from "#soundy/config";
import {
	autoPlayFunction,
	LavalinkHandler,
	PlayerSaver,
	SoundyQueueWatcher,
} from "#soundy/utils";

const logger = new Logger({
	name: "[Manager]",
});

/**
 * Main music manager class.
 */
export class SoundyManager extends LavalinkManager {
	/**
	 * Lavalink handler instance.
	 * This handles all Lavalink events and interactions.
	 * @type {LavalinkHandler}
	 */
	private lavalinkHandler: LavalinkHandler;
	/**
	 *
	 * Create a new instance of the manager.
	 * @param client The client.
	 */

	private playerSaver: PlayerSaver;

	constructor(client: Soundy) {
		super({
			nodes,
			autoSkip: true,
			autoMove: true,
			autoSkipOnResolveError: true,
			sendToShard: (guildId, payload) =>
				client.gateway.send(client.gateway.calculateShardId(guildId), payload),
			queueOptions: {
				maxPreviousTracks: 25,
				queueChangesWatcher: new SoundyQueueWatcher(client),
			},
			playerOptions: {
				defaultSearchPlatform: client.config.defaultSearchPlatform,
				onDisconnect: {
					autoReconnect: true,
					// destroyPlayer: true,
				},
				onEmptyQueue: {
					autoPlayFunction,
					// destroyAfterMs: 60_000, // 1 minute
				},
				useUnresolvedData: true,
			},
		});
		this.playerSaver = new PlayerSaver(client.logger);
		this.lavalinkHandler = new LavalinkHandler(client);
	}

	/**
	 * Inisialisasi playerSaver, tunggu database siap, dan lakukan cleanup node sessions.
	 */
	private async initPlayerSaver(): Promise<void> {
		await this.playerSaver.waitForReady();
		const validNodeHosts = nodes.map((node) => node.host);
		await this.playerSaver.cleanupNodeSessions(validNodeHosts);
	}

	/**
	 *
	 * Search tracks.
	 * @param query The query.
	 * @returns
	 */
	public search(query: string, source?: SearchPlatform): Promise<SearchResult> {
		const nodes = this.nodeManager.leastUsedNodes();
		if (!nodes.length) throw new Error("No available Lavalink nodes");
		const node = nodes[Math.floor(Math.random() * nodes.length)];
		if (!node) throw new Error("No available Lavalink node for search");
		return node.search({ query, source }, null, false);
	}

	/**
	 * Load the manager.
	 */
	public async load(): Promise<void> {
		await this.initPlayerSaver();
		await this.lavalinkHandler.load();

		const savedSessions = await this.playerSaver.getAllNodeSessions();
		logger.info(`[Music] Found ${savedSessions.size} saved node sessions`);
		for (const node of this.nodeManager.nodes.values()) {
			const savedSessionId = savedSessions.get(node.options.host);
			if (savedSessionId) {
				node.options.sessionId = savedSessionId;
			} else {
				logger.info(
					`[Music] No saved session ID found for node ${node.options.id}`,
				);
			}
		}

		logger.info("MusicHandler loaded");
	}
}
