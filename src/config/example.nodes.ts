// RENAME MEEEEEE TO nodes.ts AND UPDATE THE CONFIGURATION ACCORDINGLY

import type { LavalinkNodeOptions } from "lavalink-client";

export const nodes: LavalinkNodeOptions[] = [
	{
		id: "Tsukasa",
		host: "localhost",
		port: 3465,
		authorization: "TsukasaAlyaMahiru",
		secure: false,
	},

	// add more nodes here if needed
];
