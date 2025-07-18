export const emoji = {
	// EMOJIS //
	yes: "<:yes:1286420561341186129>",
	no: "<:no:1286420485885657098>",
	link: "<:link:1302910872821436426>",
	party: "<:party:1302910888986284032>",
	artist: "<:artist:1286590660887056394>",
	clock: "<:cooldown:1286420559269199916>",
	user: "<:user:1286590662652723250>",
	play: "<:play:1286420469431406703>",
	pause: "<:pause:1286420474372423765>",
	loop: "<:loop:1286420450569879585>",
	shuffle: "<:shuffle:1286420452612374528>",
	previous: "<:previous:1286420463010058270>",
	rewind: "<:rewind:1286420458622812263>",
	forward: "<:forward:1286420460585619547>",
	skip: "<:skip:1286420464817668160>",
	stop: "<:stop:1286582760491716619>",
	trash: "<:trash:1302914693882445874>",
	volUp: "<:volup:1286420454793543721>",
	volDown: "<:voldown:1286420456781381768>",
	list: "<:list:1302921828188295222>",
	info: "<:info:1286420443905134612>",
	music: "<:music:1286420441769971894>",
	warn: "<:warn:1286420483482583221>",
	home: "<:home:1305038165391704177>",
	globe: "<:globe:1305038163315654666>",
	slash: "<:slash:1305038167660826714>",
	ping: "<:ping:1305038170294845460>",
	question: "<:question:1305038160962785352>",
	pencil: "<:pencil:1286420448174669915>",
	think: "<a:think:1383156714404188260>",
	heart: "<:heart:1390394352416723045>",
	folder: "<:folder:1395450957227229204>",

	// NODE EMOJIS //
	nodeOn: "<:g_:1286428522084306955>",
	nodeOff: "<:r_:1286428524051304528>",
} as const;

export type EmojiConfig = typeof emoji;
export type Emoji = keyof EmojiConfig;

/*
 * Soundy - A powerful music bot built with Seyfert and lavalink-client to play high quality music in your Discord server for free.
 
 * Credits:
 * - Contributed by: iaMJ
 * - Developed by: Tronix Development
 * - Country: Indonesia

 * Discord:
 * - Tronix Development: https://discord.gg/pTbFUFdppU
  
 * Libraries & Technologies:
 * - Seyfert - Core Discord API framework
 * - lavalink-client - Lavalink client for music streaming
 * - Lavalink - Audio player backend
 * - Bun - Runtime environment

 * Copyright © 2024 Tronix Development
 * All rights reserved. This bot and its source code are under licensed by Tronix Development and copyright law on Indonesia.
 * For permission to use this bot commercially, please contact Tronix Development at https://discord.gg/pTbFUFdppU
 */
