import type { UsingClient } from "seyfert";
import {
	type GatewayActivityUpdateData,
	PresenceUpdateStatus,
} from "seyfert/lib/types";
import { BOT_ACTIVITIES, BOT_VERSION } from "#soundy/utils";

/**
 * Periodically update bot presence with dynamic stats and random activity.
 */
export function changePresence(client: UsingClient): void {
	setInterval(() => {
		const guilds = client.cache.guilds?.count() ?? 0;
		const users = client.cache.users?.count() ?? 0;
		const players = client.manager.players.size ?? 0;
		let activity =
			BOT_ACTIVITIES[Math.floor(Math.random() * BOT_ACTIVITIES.length)];
		if (!activity) {
			activity = { name: "No activity available", type: 0 };
		}
		let name = activity.name;
		name = name.replace("{users}", users.toString());
		name = name.replace("{guilds}", guilds.toString());
		name = name.replace("{players}", players.toString());
		name = name.replace("{version}", BOT_VERSION);
		const finalActivity: GatewayActivityUpdateData = { ...activity, name };
		if (client.gateway?.setPresence) {
			client.gateway.setPresence({
				status: PresenceUpdateStatus.Online,
				activities: [finalActivity],
				afk: false,
				since: Date.now(),
			});
		}
	}, 25000);
}
