import { Elysia } from "elysia";
import type { UsingClient } from "seyfert";

export function createPlaylistAPI(client: UsingClient) {
	return (
		new Elysia({ prefix: "/api/playlist" })
			// List all playlists for a user
			.get("/list/:userId", async ({ params }) => {
				const playlists = await client.database.getPlaylists(params.userId);
				return { playlists };
			})
			// View a specific playlist and its tracks
			.get("/view/:userId/:name", async ({ params }) => {
				const playlist = await client.database.getPlaylist(
					params.userId,
					params.name,
				);
				if (!playlist) return { error: "Playlist not found" };
				return { playlist };
			})
			// View a playlist by its ID
			.get("/viewById/:playlistId", async ({ params }) => {
				const playlist = await client.database.getPlaylistById(params.playlistId);
				if (!playlist) return { error: "Playlist not found" };
				return { playlist };
			})
			.post("/create", async ({ body }) => {
				const { userId, name, guildId } = body as {
					userId: string;
					name: string;
					guildId?: string;
				};
				await client.database.createPlaylist(userId, name, guildId ?? "");
				return { success: true };
			})
			.post("/add", async ({ body }) => {
				const { userId, playlist, tracks } = body as {
					userId: string;
					playlist: string;
					tracks: string[];
				};
				await client.database.addTracksToPlaylist(userId, playlist, tracks);
				return { success: true };
			})
			.post("/remove", async ({ body }) => {
				const { userId, playlist, trackUri } = body as {
					userId: string;
					playlist: string;
					trackUri: string;
				};
				await client.database.removeSong(userId, playlist, trackUri);
				return { success: true };
			})
			.post("/delete", async ({ body }) => {
				const { userId, name } = body as { userId: string; name: string };
				await client.database.deletePlaylist(userId, name);
				return { success: true };
			})
	);
}
