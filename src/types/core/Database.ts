/**
 * Database type definitions for Soundy
 */

/**
 * User-specific premium statistics
 */
export interface UserPremiumStats {
	active: boolean;
	expiresAt: Date | null;
	type: string | null;
}

/**
 * Global premium statistics (all users)
 */
export interface GlobalPremiumStats {
	activeRegularUsers: number;
	activeVoteUsers: number;
	totalActiveUsers: number;
}

/**
 * Premium statistics - can be either user-specific or global
 */
export type PremiumStats = UserPremiumStats | GlobalPremiumStats;

/**
 * Premium status for a specific user
 */
export interface PremiumStatus {
	type: string;
	timeRemaining: number;
}

/**
 * Setup channel information
 */
export interface ISetup {
	id: string;
	guildId: string;
	channelId: string;
	messageId: string;
	createdAt: Date;
}

/**
 * Guild player settings
 */
export interface GuildPlayerSettings {
	defaultVolume: number;
}

/**
 * Playlist statistics
 */
export interface PlaylistStats {
	count: number;
	tracks: number;
}

/**
 * General statistics
 */
export interface GeneralStats {
	trackStats: number;
	userStats: number;
}
