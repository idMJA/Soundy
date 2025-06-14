/**
 * Source icon URLs for supported music platforms.
 */
export const SourceIcons = {
	youtube: "https://i.imgur.com/xzVHhFY.png",
	spotify: "https://i.imgur.com/qvdqtsc.png",
	soundcloud: "https://i.imgur.com/MVnJ7mj.png",
	applemusic: "https://i.imgur.com/Wi0oyYm.png",
	deezer: "https://i.imgur.com/xyZ43FG.png",
	tidal: "https://i.imgur.com/kPqy5V0.png",
	jiosaavn: "https://i.imgur.com/N9Nt80h.png",
	default: "https://thumbs2.imgbox.com/4f/9c/adRv6TPw_t.png",
} as const;

type SourceIconsType = keyof typeof SourceIcons;

/**
 * Get the icon URL for a given source name.
 * @param sourceName The name of the music source/platform
 * @returns The icon URL for the source
 */
export const getSourceIcon = (sourceName: string): string =>
	SourceIcons[sourceName.toLowerCase() as SourceIconsType] ??
	SourceIcons.default;
