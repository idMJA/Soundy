import { Client, LimitedCollection } from "seyfert";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";
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
} from "#soundy/utils";
import { SoundyDatabase } from "#soundy/db";
import { SoundyManager } from "./modules/Manager";
import { HandleCommand } from "seyfert/lib/commands/handle";
import { Yuna } from "yunaforseyfert";

// Ganti dengan pesan custom jika ingin efek "thinking"
const THINK_MESSAGES = ["is thinking..."];
const DEBUG_MODE = false;

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
			context: SoundyContext, // FIX: use custom context so getLocale is available everywhere
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
							// Format the prefix for logging - convert mention ID to @BotName format
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
	 * Start the main Soundy process.
	 */
	private async run(): Promise<"🌟"> {
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
		return "🌟";
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
			// await this.manager.handler.reloadAll(); // Tidak ada method ini, hapus
			// await this.uploadCommands({ cachePath: this.config.cache.filename }); // Pastikan config.cache.filename ada jika ingin pakai
			this.logger.info("Soundy has been reloaded.");
		} catch (error) {
			this.logger.error("Error -", error);
			throw error;
		}
	}
}
