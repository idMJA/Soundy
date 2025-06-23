import axios from "axios";
import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import type { ClientUser } from "seyfert";

const MAX_SAME_ARTIST_IN_ROW = 3;

// Loadbalance Last.fm API keys from env, separated by comma
const LASTFM_API_KEYS = (process.env.LASTFM_API_KEY || "")
	.split(",")
	.map((k) => k.trim())
	.filter(Boolean);
let lastfmKeyIndex = 0;
function getNextLastFmKey() {
	if (LASTFM_API_KEYS.length === 0) return undefined;
	const key = LASTFM_API_KEYS[lastfmKeyIndex];
	lastfmKeyIndex = (lastfmKeyIndex + 1) % LASTFM_API_KEYS.length;
	return key;
}

// Types
type ResolvableTrack = Track | UnresolvedTrack;

interface LastFmTrack {
	name: string;
	artist: {
		name: string;
	};
}

interface LastFmSimilarResponse {
	similartracks: {
		track: LastFmTrack[];
	};
	error?: string;
}

// Helper Functions
/**
 * Filter tracks that have already been played
 * @param player The player instance
 * @param lastTrack The last played track
 * @param tracks Array of tracks to filter
 * @returns Filtered array of tracks
 */
const filterTracks = (
	player: Player,
	lastTrack: Track,
	tracks: ResolvableTrack[],
) =>
	tracks.filter(
		(track) =>
			!(
				player.queue.previous.some(
					(t) => t.info.identifier === track.info.identifier,
				) || lastTrack.info.identifier === track.info.identifier
			),
	) as Track[];

/**
 * Check if artist would exceed consecutive play limit
 * @param player The player instance
 * @param artistName The artist name to check
 * @returns boolean
 */
const wouldExceedArtistLimit = (
	player: Player,
	artistName: string | undefined,
): boolean => {
	if (!artistName) return false;

	const recentTracks = player.queue.previous.slice(
		0,
		MAX_SAME_ARTIST_IN_ROW - 1,
	);
	const consecutiveArtists = recentTracks
		.map((track) => track.info.author)
		.filter((author): author is string => typeof author === "string")
		.map((author) => author.toLowerCase());

	return (
		consecutiveArtists.length === MAX_SAME_ARTIST_IN_ROW - 1 &&
		consecutiveArtists.every((artist) => artist === artistName.toLowerCase())
	);
};

// Main Export
/**
 * Main autoplay function that handles track recommendations
 * @param player The player instance
 * @param lastTrack The last track that was played
 * @returns Promise<void>
 */
export async function autoPlayFunction(
	player: Player,
	lastTrack?: Track,
): Promise<void> {
	if (!lastTrack) return;
	if (!player.get("enabledAutoplay")) return;

	if (
		!player.queue.previous.some(
			(t) => t.info.identifier === lastTrack.info.identifier,
		)
	) {
		player.queue.previous.unshift(lastTrack);
		await player.queue.utils.save();
	}

	const me = player.get<ClientUser | undefined>("me");
	if (!me) return;

	// Use Last.fm if API key is available, otherwise fallback to Spotify
	if (LASTFM_API_KEYS.length > 0) {
		await handleLastFmRecommendations(player, lastTrack, me);
	} else {
		await handleSpotifyRecommendations(player, lastTrack, me);
	}
}

// Recommendation Handlers
/**
 * Handle Spotify-based recommendations
 * @param player The player instance
 * @param lastTrack The last played track
 * @param me The client user
 * @returns Promise<void>
 */
async function handleSpotifyRecommendations(
	player: Player,
	lastTrack: Track,
	me: ClientUser,
): Promise<void> {
	const { author, title } = lastTrack.info;
	const searchQuery = `${author} ${title}`;

	const res = await player.search({ query: searchQuery }, { requester: me });

	if (res.tracks.length >= 4) {
		// Filter tracks by artist limit
		const eligibleTracks = res.tracks.filter(
			(track) => !wouldExceedArtistLimit(player, track.info.author),
		);
		if (eligibleTracks.length === 0) return;

		// Randomly choose between index 1 (2nd track) or 3 (4th track) from eligible tracks
		const selectedIndex = Math.min(
			Math.random() < 0.5 ? 1 : 3,
			eligibleTracks.length - 1,
		);
		const track = eligibleTracks[selectedIndex];
		if (track) {
			track.requester = { id: me.id, username: me.username };
			await player.queue.add(track);
		}
	}
}

/**
 * Handle Last.fm-based recommendations
 * @param player The player instance
 * @param lastTrack The last played track
 * @param me The client user
 * @returns Promise<void>
 */
async function handleLastFmRecommendations(
	player: Player,
	lastTrack: Track,
	me: ClientUser,
): Promise<void> {
	try {
		const { author, title } = lastTrack.info;
		if (!(author && title)) return;

		const apiKey = getNextLastFmKey();
		if (!apiKey) {
			me.client.logger.warn(
				"[AUTO_PLAY] No Last.fm API key available, falling back to Spotify recommendations.",
			);
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}
		const url = `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar&artist=${encodeURIComponent(author)}&track=${encodeURIComponent(title)}&limit=10&autocorrect=1&api_key=${apiKey}&format=json`;
		const response = await axios.get<LastFmSimilarResponse>(url);

		if (
			!response.data?.similartracks?.track ||
			response.data.similartracks.track.length === 0
		) {
			// Fallback to Spotify if Last.fm returns empty track array
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}

		// Process similar tracks from Last.fm
		const tracks = response.data.similartracks.track;
		// Filter out tracks that would exceed artist limit
		const eligibleTracks = tracks.filter(
			(track) => !wouldExceedArtistLimit(player, track.artist.name),
		);

		if (eligibleTracks.length === 0) {
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}

		const similarTrack =
			eligibleTracks[Math.floor(Math.random() * eligibleTracks.length)];

		if (!(similarTrack?.artist?.name && similarTrack?.name)) {
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}

		const searchQuery = `${similarTrack.artist.name} - ${similarTrack.name}`;
		const searchResult = await player.search(
			{ query: searchQuery },
			{ requester: me },
		);

		if (searchResult.tracks.length) {
			const filteredTracks = filterTracks(
				player,
				lastTrack,
				searchResult.tracks,
			);
			const firstTrack = filteredTracks[0];
			if (firstTrack) {
				firstTrack.requester = { id: me.id, username: me.username };
				await player.queue.add(firstTrack);
			}
		}
	} catch (error) {
		if (me?.client?.logger?.error) {
			me.client.logger.error("Error in Last.fm recommendations:", error);
		} else {
			console.error("[AUTO_PLAY] Error in Last.fm recommendations:", error);
		}
		// Fallback to Spotify recommendations if Last.fm fails
		await handleSpotifyRecommendations(player, lastTrack, me);
	}
}
