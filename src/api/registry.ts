import type { Elysia } from "elysia";
import type { UsingClient } from "seyfert";
import { createMusicAPI, createPlaylistAPI, createTopAPI } from "#soundy/api";

export function applyAPIRoutes(app: Elysia, client: UsingClient): void {
	app
		.use(createMusicAPI(client))
		.use(createTopAPI(client))
		.use(createPlaylistAPI(client));
}
