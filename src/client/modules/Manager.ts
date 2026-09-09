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
	BOT_VERSION,
	isRateLimitOrRecoverableSearchError,
	LavalinkHandler,
	PlayerSaver,
	SoundyPlayer,
	SoundyQueueWatcher,
	transformRequester,
} from "#soundy/utils";

const logger = new Logger({
	name: "[Manager]",
});

/**
 * Main music manager class.
 */
export class SoundyManager extends LavalinkManager<SoundyPlayer> {
	/**
	 * Client instance.
	 * @type {Soundy}
	 */
	public readonly client: Soundy;

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
			playerClass: SoundyPlayer,
			httpHeaders: {
				"x-bot-name": "Soundy",
				"x-bot-version": BOT_VERSION,
			},
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
				requesterTransformer: transformRequester,
				onDisconnect: {
					autoReconnect: true,
				},
				onEmptyQueue: {
					autoPlayFunction,
				},
				useUnresolvedData: true,
			},
		});
		this.client = client;
		this.playerSaver = new PlayerSaver(client.logger);
		this.lavalinkHandler = new LavalinkHandler(client);

		this.nodeManager.on("disconnect", (node, reason) => {
			client.logger.warn(
				`[Lavalink Auto-Failover] Node ${node.options.id} disconnected (${reason?.code ?? "unknown"}). Checking failover options...`,
			);
			const availableNode = Array.from(this.nodeManager.nodes.values()).find(
				(n) => n.id !== node.id && n.connected,
			);
			if (availableNode) {
				client.logger.info(
					`[Lavalink Auto-Failover] Migrating active players to node ${availableNode.options.id}`,
				);
				for (const player of this.players.values()) {
					if (player.node.id === node.id) {
						player.changeNode(availableNode.id);
					}
				}
			}
		});
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
	 * @param source The search platform.
	 * @returns
	 */
	public async search(
		query: string,
		source?: SearchPlatform,
	): Promise<SearchResult> {
		const node = Array.from(this.nodeManager.nodes.values()).find(
			(n) => n.connected,
		);
		if (!node) throw new Error("No available connected music nodes");

		const isUrl = /^https?:\/\//.test(query);
		const initialSource = source || this.client?.config.defaultSearchPlatform;
		const fallbackPlatform = this.client?.config.fallbackSearchPlatform;

		if (isUrl || !fallbackPlatform || initialSource === fallbackPlatform) {
			return node.search({ query, source }, null, false);
		}

		try {
			const result = await node.search({ query, source }, null, false);

			if (isRateLimitOrRecoverableSearchError(result)) {
				this.client?.logger.warn(
					`[Manager Search Fallback] Primary platform '${initialSource}' failed (loadType: ${result.loadType}${result.exception?.message ? `, message: ${result.exception.message}` : ""}). Falling back to '${fallbackPlatform}' for query: "${query}"`,
				);
				return await node.search(
					{ query, source: fallbackPlatform },
					null,
					false,
				);
			}

			return result;
		} catch (error) {
			if (isRateLimitOrRecoverableSearchError(undefined, error)) {
				this.client?.logger.warn(
					`[Manager Search Fallback] Primary platform '${initialSource}' threw error (${error instanceof Error ? error.message : String(error)}). Falling back to '${fallbackPlatform}' for query: "${query}"`,
				);
				return await node.search(
					{ query, source: fallbackPlatform },
					null,
					false,
				);
			}

			throw error;
		}
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
