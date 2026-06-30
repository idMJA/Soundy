// RENAME MEEEEEE TO nodes.ts AND UPDATE THE CONFIGURATION ACCORDINGLY

import { type LavalinkNodeOptions, NodeType } from "lavalink-client";

export const nodes: LavalinkNodeOptions[] = [
	{
		id: "Tsukasa (Lavalink example)",
		host: "localhost",
		port: 2333,
		authorization: "youshallnotpass",
		secure: false,
		nodeType: NodeType.Lavalink,
	},
	{
		id: "Alya (NodeLink example)",
		host: "localhost",
		port: 3000,
		authorization: "youshallnotpass",
		secure: false,
		nodeType: NodeType.NodeLink,
	},

	// add more nodes here if needed
];
