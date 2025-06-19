import { Elysia } from "elysia";
import type { UsingClient } from "seyfert";

export function createTopAPI(client: UsingClient) {
	return new Elysia({ prefix: "/api/top" })
		.get("/tracks", async ({ query }) => {
			const guildId = query.guildId || "";
			const limit = Number(query.limit) || 10;
			const tracks = await client.database.getTopTracks(guildId, limit);
			return { tracks };
		})
		.get("/users", async ({ query }) => {
			const guildId = query.guildId || "";
			const limit = Number(query.limit) || 10;
			const users = await client.database.getTopUsers(guildId, limit);
			return { users };
		})
		.get("/guilds", async ({ query }) => {
			const limit = Number(query.limit) || 10;
			const guilds = await client.database.getTopGuilds(limit);
			return { guilds };
		});
}
