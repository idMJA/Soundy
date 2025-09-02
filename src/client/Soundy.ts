import { Client, LimitedCollection } from "seyfert";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";
import { HandleCommand } from "seyfert/lib/commands/handle";
import { Yuna } from "yunaforseyfert";

import type { SoundyConfiguration } from "#soundy/types";
import { SoundyMiddlewares } from "#soundy/middlewares";
import { Configuration } from "#soundy/config";
import {
	SoundyContext,
	getWatermark,
	handleMention,
	isBotMention,
	onRunError,
	sendCommandLog,
	THINK_MESSAGES,
	DEBUG_MODE,
} from "#soundy/utils";
import { SoundyDatabase } from "#soundy/db";
import { SoundyManager } from "./modules/Manager";

/**
 * Main Soundy class.
 */
export default class Soundy extends Client<true> {
	/**
	 * Soundy cooldowns collection.
	 */
	public readonly cooldowns: LimitedCollection<string, number> =
		new LimitedCollection();

	/**
	 * Soundy configuration.
	 */
	public readonly config: SoundyConfiguration = Configuration;

	/**
	 * The timestamp when Soundy is ready.
	 */
	public readyTimestamp = 0;

	/**
	 * Soundy manager instance.
	 */
	public readonly manager: SoundyManager;

	/**
	 * Soundy database instance.
	 */
	public readonly database: SoundyDatabase;

	/**
	 * Create a new Soundy instance.
	 */
	constructor() {
		super({
			context: SoundyContext,
			globalMiddlewares: [
				"checkCooldown",
				"checkVerifications",
				"checkPremium",
			],
			allowedMentions: {
				replied_user: false,
				parse: ["roles", "users"],
			},
			components: {
				defaults: {
					onRunError,
				},
			},
			commands: {
				reply: () => true,
				prefix: async (message) => {
					const prefixes = [
						await this.database.getPrefix(message.guildId ?? ""),
					];
					if (
						message?.mentions?.users?.some(
							(user) => "id" in user && user.id === this.me.id,
						)
					) {
						prefixes.push(`<@${this.me.id}>`, `<@!${this.me.id}>`);
					}
					if (isBotMention(message, this.me.id)) {
						handleMention(this, message, prefixes);
					}

					// Check if message starts with any of the prefixes
					const usedPrefix = prefixes.find((prefix) =>
						message.content.startsWith(prefix),
					);
					if (usedPrefix) {
						const commandName = message.content
							.slice(usedPrefix.length)
							.trim()
							.split(" ")[0];
						if (commandName) {
							let logPrefix: string;
							if (
								usedPrefix.startsWith("<@") ||
								usedPrefix === `@${this.me.username}`
							) {
								logPrefix = `@${this.me.username} `;
							} else {
								logPrefix = usedPrefix;
							}

							await sendCommandLog(this, {
								guildName: message.guild?.name,
								guildId: message.guildId,
								channelName: message.channel.name,
								channelId: message.channelId,
								commandName,
								commandType: "Prefix/Mentions",
								userId: message.author.id,
								username: message.author.username,
								displayName: message.member?.displayName,
								prefix: logPrefix,
							});
						}
					}
					return prefixes.map((p) => p.toLowerCase());
				},
				defaults: {
					onRunError,
				},
				deferReplyResponse: ({ client }) => {
					return {
						content: `${client.config.emoji.think} **${client.me.username}** ${THINK_MESSAGES[Math.floor(Math.random() * THINK_MESSAGES.length)]}`,
					};
				},
			},
			presence: () => ({
				afk: false,
				since: Date.now(),
				status: PresenceUpdateStatus.Idle,
				activities: [{ name: "Traveling... 🌠", type: ActivityType.Playing }],
			}),
		});
		this.manager = new SoundyManager(this);
		this.database = new SoundyDatabase();
		this.run();
	}

	/**
	 * Setup process event listeners
	 */
	private setupProcessListeners(): void {
		process.on("unhandledRejection", (reason, promise) => {
			this.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
			this.logger.warn("Bot will continue running despite the error");
		});

		process.on("uncaughtException", (error) => {
			this.logger.error("Uncaught Exception:", error);
			this.logger.warn("Bot will continue running despite the critical error");
		});

		process.on("SIGINT", () => {
			this.logger.info("Received SIGINT (Ctrl+C), shutting down the bots...");
			process.exit(0);
		});

		process.on("SIGTERM", () => {
			this.logger.info("Received SIGTERM, shutting down the bots...");
			process.exit(0);
		});

		process.on("warning", (warning) => {
			this.logger.warn("Process Warning:", warning.name, warning.message);
		});

		this.logger.info(
			"Process event listeners setup completed - Bot will stay alive on errors",
		);
	}

	/**
	 * Start the main Soundy process.
	 */
	private async run(): Promise<"🥘"> {
		this.setupProcessListeners();

		getWatermark();
		this.commands.onCommand = (file) => {
			const command = new file();
			return command;
		};
		this.setServices({
			middlewares: SoundyMiddlewares,
			cache: {
				disabledCache: {
					bans: true,
					emojis: true,
					stickers: true,
					roles: true,
					presences: true,
					stageInstances: true,
				},
			},
			handleCommand: class extends HandleCommand {
				override argsParser = Yuna.parser({
					logResult: DEBUG_MODE,
					syntax: {
						namedOptions: ["-", "--"],
					},
				});
				override resolveCommandFromContent = Yuna.resolver({
					client: this.client,
					logResult: DEBUG_MODE,
				});
			},
			langs: {
				default: this.config.defaultLocale,
				aliases: {
					"es-419": ["es-ES"],
				},
			},
		});
		await this.start();
		await this.manager.load();
		return "🥘";
	}

	/**
	 * Reload Soundy...
	 */
	public async reload(): Promise<void> {
		this.logger.warn("Attemping to reload...");
		try {
			await this.events?.reloadAll();
			await this.commands?.reloadAll();
			await this.components?.reloadAll();
			await this.langs?.reloadAll();
			// await this.manager.handler.reloadAll(); // Tidak ada method ini
			this.logger.info("Soundy has been reloaded.");
		} catch (error) {
			this.logger.error("Error -", error);
			throw error;
		}
	}
}
