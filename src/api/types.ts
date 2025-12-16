import type { Elysia } from "elysia";
import type { UsingClient } from "seyfert";
import type { PlayerData } from "#soundy/types";

export interface SoundyWS {
	send: (data: string) => void;
	/**
	 * Elysia >=1.4.19 exposes `ws.data` for per-connection state.
	 * Keep `store` for backward compatibility with pre-1.4.19 code.
	 */
	data?: {
		guildId?: string;
		voiceChannelId?: string;
		userId?: string;
		[key: string]: unknown;
	};
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

export type ElysiaApp = Elysia & {
	client: UsingClient;
	server?: {
		clients?: Set<{ readyState: number; send: (msg: string) => void }>;
		ws?: {
			clients?: Set<{ readyState: number; send: (msg: string) => void }>;
		};
	} & Record<string, unknown>;
};

export type SearchQuery =
	| string
	| {
			query: string;
			source?: string;
			requester?: { id: string };
	  };
