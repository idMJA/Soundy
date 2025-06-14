import axios from "axios";

export interface RecommendationTrack {
	name: string;
	artist: string;
	listeners: number;
}

export interface RecommendationResponse {
	status: string;
	data: RecommendationTrack[];
}

/**
 * Fetches top tracks from Last.fm for a given country
 * @param country Country name (e.g., 'indonesia', 'united states', 'japan')
 * @returns Array of RecommendationTrack or empty array if failed
 */
export async function getTopTracksByCountry(
	country: string,
): Promise<RecommendationTrack[]> {
	const apiKeys = (process.env.LASTFM_API_KEY || "")
		.split(",")
		.map((k) => k.trim())
		.filter(Boolean);
	let lastfmKeyIndex = 0;
	function getNextLastFmKey() {
		if (apiKeys.length === 0) return undefined;
		const key = apiKeys[lastfmKeyIndex];
		lastfmKeyIndex = (lastfmKeyIndex + 1) % apiKeys.length;
		return key;
	}

	const apiKey = getNextLastFmKey();
	if (!apiKey) return [];

	const url = `https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=${encodeURIComponent(country)}&api_key=${apiKey}&format=json`;
	try {
		const response = await axios.get(url, { timeout: 5000 });
		const tracks = response.data?.tracks?.track;
		if (!Array.isArray(tracks)) return [];
		// Use a more specific type for Last.fm track
		return tracks.map(
			(track: {
				name: string;
				artist: { name: string };
				listeners: string;
			}) => ({
				name: track.name,
				artist: track.artist?.name || "",
				listeners: Number(track.listeners) || 0,
			}),
		);
	} catch (error) {
		console.error(`Error fetching top tracks for ${country}:`, error);
		return [];
	}
}

// Helper array for specific countries, easy to extend and use all at once
export const getTopTrack = ["indonesia", "united states", "japan"].map(
	(country) => ({
		country,
		getTracks: () => getTopTracksByCountry(country),
	}),
);

/**
 * Get all top tracks from all countries in getTopTrack
 * @returns Promise<{ country: string; tracks: RecommendationTrack[] }[]>
 */
export async function getAllTopTracks() {
	return Promise.all(
		getTopTrack.map(async ({ country, getTracks }) => ({
			country,
			tracks: await getTracks(),
		})),
	);
}
