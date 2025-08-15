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
			// View a playlist by its ID
			.get("/view/:playlistId", async ({ params }) => {
				const playlist = await client.database.getPlaylistById(
					params.playlistId,
				);
				if (!playlist) return { error: "Playlist not found" };
				return { playlist };
			})
			.post("/create", async ({ body }) => {
				const { userId, name } = body as {
					userId: string;
					name: string;
				};
				await client.database.createPlaylist(userId, name);
				return { success: true };
			})
			.post("/add", async ({ body }) => {
				const { playlistId, tracks } = body as {
					playlistId: string;
					tracks: Array<{ url: string; info?: object }>;
				};
				await client.database.addTracksToPlaylist(playlistId, tracks);
				return { success: true };
			})
			.post("/remove", async ({ body }) => {
				const { playlistId, trackId } = body as {
					playlistId: string;
					trackId: string;
				};
				await client.database.removeSong(playlistId, trackId);
				return { success: true };
			})
			.post("/delete", async ({ body }) => {
				const { userId, playlistId } = body as {
					userId: string;
					playlistId: string;
				};
				await client.database.deletePlaylist(userId, playlistId);
				return { success: true };
			})
	);
}
