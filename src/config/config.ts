import type { SoundyConfiguration, SoundyEnvironment } from "#soundy/types";
import { emoji } from "./emoji";

const { TOKEN, DATABASE_URL, DATABASE_PASSWORD } = process.env;

export const Configuration: SoundyConfiguration = {
	defaultPrefix: "s!", // Default prefix for commands
	defaultSearchPlatform: "spotify", // Default search platform for music commands
	defaultVolume: 60, // Default volume level for music playback
	defaultLocale: "en-US", // Default locale for the bot
	lyricsLines: 11, // Number of lyrics lines to display
	serverPort: 4000, // Port for the API server
	info: {
		banner: "https://i.ibb.co.com/z8c0SQK/bannersoundy-FHD.png", // Replace with actual banner URL
		inviteLink:
			"https://discord.com/oauth2/authorize?client_id=1168385371294420992",
		supportServer: "https://discord.gg/pTbFUFdppU",
		voteLink: "https://top.gg/bot/1168385371294420992/vote",
	},
	topgg: {
		enabled: false,
		webhookAuth: "S6:<&ZhpQT}ZJ&coHZ4|;M7T3!V6OkoupD7Qz!##", // Replace with actual webhook auth token
		token:
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNjgzODUzNzEyOTQ0MjA5OTIiLCJib3QiOnRydWUsImlhdCI6MTczMjMzNDMwMX0.ZaliaLH24inHJERiHxfjXHzGKXSPj6sFhruFJSNwf-A", // Replace with actual Top.gg token
	},
	premium: {
		enabled: false, // Enable or disable premium features
	},
	cache: {
		filename: "commands.json", // Name of the cache file
		size: 5, // Size of the cache
	},
	developersIds: ["885731228874051624", "169711695932030976"], // Replace with actual developer IDs
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
		nodeLog:
			"https://discord.com/api/webhooks/1325160873311993876/MGqy3SJNJg_ZQx63r7SSldWOSlLHoVOF0ojuxF7OcnO7OK-uPmuWJnlmlJDikfQuVn95", // Node logs
		guildLog:
			"https://discord.com/api/webhooks/1326531769385619517/PLS9JJy6l1TaSTCfpW061pGMGAtxwQFuNEWFvtaw8w-ULKK5uYMCBesmfcMT7hlwxF0j", // Guild logs
		commandLog:
			"https://discord.com/api/webhooks/1325160679497400465/uthdw1T-R4DgsWY5jDpcfrdRQMkVSon4_heaGOb3uYh9kH5JNpNCFSWp604h-2xQimlU", // Command logs
		voteLog:
			"https://discord.com/api/webhooks/1260482354535989259/LE4VUln4eUaaE_pTzU8IkU1lFQS_mn24f2C8OpBosCVkWETTO1oFiDyIgfWnJ8BqTD4s", // Vote logs
		errorLog:
			"https://discord.com/api/webhooks/1325125857525629009/Y7CpDtdtj-u8IJUtY4uZQ4Gn0ORqDyWaqYBBtenVx9r6c1hBsWflYHPoA_EEsFEwgw-k", // Error logs
		report:
			"https://discord.com/api/webhooks/1351961646985379850/uUrrZm8bjhkT_g25qYCED_LPbTTlZBqj9wjYNhR1M9yGlNRlcNzizwtFbuN97GdFaZnj", // Bug or suggestion reports
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
