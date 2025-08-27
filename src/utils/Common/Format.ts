import type { LavalinkTrack } from "lavalink-client";

/**
 * Format track information for logging
 * @param track - The Lavalink track object
 * @returns Formatted track information as a string
 */
export function formatTrackInfo(track: LavalinkTrack): string {
	if (!track) return "Unknown track";

	const title = track.info.title || "Unknown Title";
	const author = track.info.author || "Unknown Artist";
	const uri = track.info.uri || "";
	const length = track.info.length
		? formatDuration(track.info.length)
		: "Unknown Duration";

	let formattedInfo = `${title} by ${author}`;
	if (length) formattedInfo += ` | ${length}`;
	if (track.info.sourceName)
		formattedInfo += ` | Source: ${track.info.sourceName}`;
	if (uri) formattedInfo += ` | ${uri}`;

	return formattedInfo;
}

/**
 * Format duration in milliseconds to human-readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration as string
 */
export function formatDuration(ms: number): string {
	if (!ms || Number.isNaN(ms) || ms <= 0) return "0:00";

	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor(ms / (1000 * 60 * 60));

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format bytes to human-readable format
 * @param bytes - The number of bytes
 * @returns Formatted bytes as string
 */
export function formatBytes(bytes: number) {
	const mb = bytes / 1024 / 1024;
	return `${mb.toFixed(2)} MB`;
}
