import { readFileSync } from "node:fs";

import {
	ActivityType,
	type GatewayActivityUpdateData,
} from "seyfert/lib/types";

const packageJSON = JSON.parse(readFileSync("./package.json", "utf-8"));

/**
 * Soundy version.
 */
export const BOT_VERSION: string = packageJSON.version;

/**
 * Check if Soundy is running in DEBUG MODE.
 */
export const DEBUG_MODE: boolean = process.argv.includes("--debug");

/**
 * Check if Soundy is running in DEV MODE.
 */
export const DEV_MODE: boolean = process.argv.includes("--dev");

/**
 * Soundy think messages.
 */
export const THINK_MESSAGES: string[] = [
	"is contemplating nature...",
	"is watching the sunrise...",
	"is observing the ocean waves...",
	"is listening to birdsong...",
	"is feeling the mountain breeze...",
	"is walking through forests...",
	"is watching falling leaves...",
	"is following river streams...",
	"is counting stars above...",
	"is watching clouds drift by...",
	"is feeling morning dew...",
	"is chasing butterflies...",
	"is watching flowers bloom...",
	"is climbing tall trees...",
	"is watching northern lights...",
	"is feeling ocean spray...",
];

/**
 * Soundy eval secrets messages.
 */
export const SECRETS_MESSAGES: string[] = [
	"That's... restricted information...",
	"Hey! You can't see that.",
	"Don't you have better things to do?",
	"No, I won't let you see that...",
	"That information, is private...",
	"Hey! Mind your business...",
	"I'm getting bored of this....",
	"ENOUGH!",
	"I'm serious... I'm tired...",
	"...",
	"I will restrict you if you continue...",
];

/**
 * Soundy presence activities.
 */
export const BOT_ACTIVITIES: GatewayActivityUpdateData[] = [
	{ name: "the Space. 🌠", type: ActivityType.Listening },
	{ name: `v${BOT_VERSION}. 🐐`, type: ActivityType.Listening },
	{ name: "with {users} users. 🎧", type: ActivityType.Listening },
	{ name: "in {guilds} guilds. ❤️", type: ActivityType.Streaming },
	{ name: "with {users} users. 👤", type: ActivityType.Playing },
	{ name: "{players} players. 🌐", type: ActivityType.Watching },
];
