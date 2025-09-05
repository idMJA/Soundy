import type { PermissionStrings } from "seyfert";
import type { EmojiConfig } from "#soundy/config";
import type { SearchPlatform } from "lavalink-client";

/**
 * The colors configuration interface.
 */
interface Colors {
	/**
	 * The primary color of the bot.
	 * @type {number}
	 */
	primary: number;
	/**
	 * The secondary color of the bot.
	 * @type {number}
	 */
	secondary: number;
	/**
	 * The color used for positive responses.
	 * @type {number}
	 */
	yes: number;
	/**
	 * The color used for negative responses.
	 * @type {number}
	 */
	no: number;
	/**
	 * The color used for warning responses.
	 * @type {number}
	 */
	warn?: number;
}

/**
 * The configuration interface.
 */
export interface SoundyConfiguration {
	/**
	 * The default prefix used to use text commands.
	 * @type {string}
	 */
	defaultPrefix: string;
	/**
	 * The default player search engine.
	 * @type {string}
	 */
	defaultSearchPlatform: SearchPlatform;
	/**
	 * The default player volume.
	 * @type {number}
	 */
	defaultVolume: number;
	/**
	 * The default locale for the bot.
	 * @type {string}
	 * @default "en-US"
	 */
	defaultLocale: string;
	/**
	 * The number of lyrics lines to display.
	 * @type {number}
	 * @default 10
	 */
	lyricsLines: number;
	/**
	 * The port for the API server.
	 * @type {number}
	 */
	serverPort: number;
	/**
	 * The bot information.
	 * @type {Object}
	 */
	info: BotInfo;
	/**
	 * The Top.gg configuration.
	 * @type {TopGG}
	 */
	topgg: TopGG;
	/**
	 * The premium configuration.
	 * @type {PremiumConfig}
	 */
	premium: PremiumConfig;
	/**
	 * The cache configuration.
	 * @type {CacheConfig}
	 */
	cache: CacheConfig;
	/**
	 * The developer IDs.
	 * @type {string[]}
	 */
	developersIds: string[];
	/**
	 * The permissions configuration.
	 * @type {PermissionsConfig}
	 */
	permissions: PermissionsConfig;
	/**
	 * The colors configuration.
	 * @type {Colors}
	 */
	color: Colors;
	/**
	 * The webhooks configuration.
	 * @type {SoundyWebhooks}
	 */
	webhooks: SoundyWebhooks;
	/**
	 * The emoji configuration.
	 * @type {EmojiConfig}
	 */
	emoji: EmojiConfig;
}

/**
 * The bot information interface.
 */
interface BotInfo {
	/**
	 * The bot banner URL.
	 * @type {string}
	 */
	banner: string;
	/**
	 * The bot invite link.
	 * @type {string}
	 */
	inviteLink: string;
	/**
	 * The support server link.
	 * @type {string}
	 */
	supportServer: string;
	/**
	 * The bot vote link.
	 * @type {string}
	 */
	voteLink: string;
}

interface PremiumConfig {
	/**
	 * The premium features enabled.
	 * @type {boolean}
	 */
	enabled: boolean;
}

interface CacheConfig {
	/**
	 * The cache filename.
	 * @type {string}
	 */
	filename: string;
	/**
	 * The cache size.
	 * @type {number}
	 */
	size: number;
}

interface PermissionsConfig {
	/**
	 * The permissions for stage channels.
	 * @type {PermissionStrings}
	 */
	stagePermissions: PermissionStrings;
	/**
	 * The permissions for voice channels.
	 * @type {PermissionStrings}
	 */
	voicePermissions: PermissionStrings;
}

export interface SoundyWebhooks {
	/** Discord webhook URL for node logs */
	nodeLog: string;
	/** Discord webhook URL for vote logs */
	voteLog: string;
	/** Discord webhook URL for guild logs */
	guildLog: string;
	/** Discord webhook URL for command logs */
	commandLog: string;
	/** Discord webhook URL for error logs */
	errorLog: string;
	/** Discord webhook URL for report bugs or suggestions */
	report: string;
}

interface TopGG {
	/**
	 * Whether the Top.gg auto poster is enabled.
	 * @type {boolean}
	 */
	enabled: boolean;
	/**
	 * The Top.gg webhook authentication token.
	 * @type {string}
	 */
	webhookAuth: string;
	/**
	 * The Top.gg API token.
	 * @type {string}
	 */
	token: string;
}

/**
 * The environment variables interface.
 */
export interface SoundyEnvironment {
	/**
	 * The bot token.
	 * @type {string}
	 */
	Token?: string;
	/**
	 * The database URL.
	 * @type {string}
	 */
	DatabaseUrl?: string;
	/**
	 * The database password.
	 * @type {string}
	 */
	DatabasePassword?: string;
}
