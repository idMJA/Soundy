// Define player data interface for what we expect from the player object
export interface PlayerData {
	guildId: string;
	voiceChannelId?: string;
	textChannelId?: string;
	messageId?: string; // <--- simpan now playing buat diapus pake trackEnd, queueEnd, playerDestroy
	nodeId?: string;
	nodeSessionId?: string;
	volume?: number;
	options?: {
		selfDeaf?: boolean;
		selfMute?: boolean;
		applyVolumeAsFilter?: boolean;
		instaUpdateFiltersFix?: boolean;
		vcRegion?: string;
	};
	repeatMode?: "off" | "track" | "queue"; // <-- Tambahkan repeatMode
	enabledAutoplay?: boolean; // <-- Add this line for autoplay persistence
	lyricsEnabled?: boolean; // <-- Add this line for lyrics state persistence
	lyricsId?: string; // <-- Add this line for lyrics message ID persistence
	lyricsRequester?: string; // <-- Add this line for lyrics requester persistence
	localeString?: string; // <-- Add this line for locale string persistence
	lyrics?: {
		provider?: string;
		text?: string;
		lines?: Array<{
			line: string;
			timestamp?: number;
		}>;
	}; // <-- Add this line for lyrics data persistence
	track?:
		| string
		| {
				encoded?: string;
				info?: {
					title?: string;
					uri?: string;
					length?: number;
					thumbnail?: string;
					artworkUrl?: string;
				};
				requester?: { id: unknown } | string | null;
		  };
	queue?: Array<{
		encoded?: string;
		info?: {
			title?: string;
			uri?: string;
			author?: string;
			length?: number;
			identifier?: string;
			isStream?: boolean;
			isSeekable?: boolean;
			sourceName?: string;
			thumbnail?: string;
			artworkUrl?: string;
		};
		requester?: { id: unknown } | string | null;
	}>;
}

// Define data structure for the database
export interface DatabaseSchema {
	players: Record<string, PlayerData>;
	sessions: Record<string, string>; // nodeId -> sessionId
}

// Define lyrics data interface
export interface LyricsData {
	lyricsEnabled?: boolean;
	lyricsId?: string;
	lyricsRequester?: string;
	localeString?: string;
	lyrics?: {
		provider?: string;
		text?: string;
		lines?: Array<{
			line: string;
			timestamp?: number;
		}>;
	};
}

// Define queue track interface
export interface QueueTrack {
	encoded?: string;
	info?: {
		title?: string;
		uri?: string;
		author?: string;
		length?: number;
		identifier?: string;
		isStream?: boolean;
		isSeekable?: boolean;
		sourceName?: string;
		thumbnail?: string;
	};
	requester?: string | { id: unknown } | null;
}

// Define now playing message interface
export interface NowPlayingMessage {
	messageId?: string;
	channelId?: string;
}
