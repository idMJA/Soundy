import type { UsingClient } from "seyfert";
import type { PlayerData } from "#soundy/types";

export interface SoundyWS {
	send: (data: string) => void;
	store?: {
		guildId?: string;
		voiceChannelId?: string;
		userId?: string;
	};
}

export interface MusicPlayerStatus {
	connected: boolean;
	playing: boolean;
	paused: boolean;
	volume: number;
	position: number;
	current: {
		title: string;
		author: string;
		duration: number;
		uri: string;
		artwork?: string;
		isStream: boolean;
		position?: number;
	} | null;
	queue: Array<{
		title: string;
		author: string;
		duration: number;
		uri: string;
		artwork?: string;
		requester?: string;
	}>;
	repeatMode: number;
	autoplay: boolean;
}

export interface PlayRequest {
	query: string;
	voiceChannelId: string;
}

export interface VolumeRequest {
	volume: number;
}

export interface WSMessage {
	type: string;
	guildId?: string;
	[key: string]: unknown;
}

export interface PlayerSaver {
	getPlayer?: (guildId: string) => Promise<PlayerData | null>;
}

export interface ElysiaApp {
	ws: (path: string, handlers: Record<string, unknown>) => void;
	server?: { clients?: Set<unknown> };
	client: UsingClient;
	_client?: Client;
}

export type SearchQuery =
	| string
	| {
			query: string;
			source?: string;
			requester?: { id: string };
	  };
