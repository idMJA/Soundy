import ky from "ky";

export interface RecommendationTrack {
	name: string;
	artist: string;
	listeners: number;
}

export interface RecommendationResponse {
	status: string;
	data: RecommendationTrack[];
}

interface LastFmGeoTopTracksResponse {
	tracks?: {
		track?: Array<{
			name: string;
			artist: { name: string };
			listeners: string;
		}>;
	};
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
		const res = await ky
			.get(url, { timeout: 5000 })
			.json<LastFmGeoTopTracksResponse>();
		const tracks = res?.tracks?.track;
		if (!Array.isArray(tracks)) return [];
		return tracks.map((track) => ({
			name: track.name,
			artist: track.artist?.name || "",
			listeners: Number(track.listeners) || 0,
		}));
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

let topTracksCache:
	| { country: string; tracks: RecommendationTrack[] }[]
	| null = null;
let topTracksCacheExpiry = 0;

/**
 * Get all top tracks from all countries in getTopTrack
 * @returns Promise<{ country: string; tracks: RecommendationTrack[] }[]>
 */
export async function getAllTopTracks() {
	const now = Date.now();
	if (topTracksCache && now < topTracksCacheExpiry) {
		return topTracksCache;
	}

	const result = await Promise.all(
		getTopTrack.map(async ({ country, getTracks }) => ({
			country,
			tracks: await getTracks(),
		})),
	);

	if (result.some(({ tracks }) => tracks.length > 0)) {
		topTracksCache = result;
		topTracksCacheExpiry = now + 15 * 60 * 1000;
	}

	return result;
}
