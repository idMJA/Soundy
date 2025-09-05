import type { SoundyConfiguration, SoundyEnvironment } from "#soundy/types";
import { emoji } from "./emoji";

const { TOKEN, DATABASE_URL, DATABASE_PASSWORD } = process.env;

export const Configuration: SoundyConfiguration = {
	defaultPrefix: "!", // Default prefix for commands
	defaultSearchPlatform: "spotify", // Default search platform for music commands
	defaultVolume: 100, // Default volume for music playback
	defaultLocale: "en-US", // Default locale for the bot
	lyricsLines: 10, // Number of lyrics lines to display
	serverPort: 3000, // Port for the API server
	info: {
		banner: "https://i.ibb.co.com/z8c0SQK/bannersoundy-FHD.png", // Replace with actual banner URL
		inviteLink:
			"https://discord.com/oauth2/authorize?client_id=1168385371294420992",
		supportServer: "https://discord.gg/pTbFUFdppU",
		voteLink: "https://top.gg/bot/1168385371294420992/vote",
	},
	topgg: {
		enabled: false,
		webhookAuth: "xxx", // Replace with actual webhook auth token
		token: "xxx", // Replace with actual Top.gg token
	},
	premium: {
		enabled: false, // Enable or disable premium features
	},
	cache: {
		filename: "commands.json", // Name of the cache file
		size: 5, // Size of the cache
	},
	developersIds: ["885731228874051624", "123456789012345678"], // Replace with actual developer IDs
	permissions: {
		stagePermissions: ["MuteMembers"],
		voicePermissions: ["ViewChannel", "Connect", "Speak"],
	},
	color: {
		primary: 0x00ff33, // Primary color for embeds
		secondary: 0x00ff00, // Secondary color for embeds

		yes: 0x00ff33, // Color for positive responses
		no: 0xff0000, // Color for negative responses
		warn: 0xffff00, // Color for warning responses
	},
	webhooks: {
		nodeLog: "xxx", // Node logs
		guildLog: "xxx", // Guild logs
		commandLog: "xxx", // Command logs
		voteLog: "xxx", // Vote logs
		errorLog: "xxx", // Error logs
		report: "xxx", // Bug or suggestion reports
	},

	emoji,
};

export const Environment: SoundyEnvironment = {
	Token: TOKEN,
	DatabaseUrl: DATABASE_URL,
	DatabasePassword: DATABASE_PASSWORD,
};

export * from "./nodes";
export * from "./emoji";
