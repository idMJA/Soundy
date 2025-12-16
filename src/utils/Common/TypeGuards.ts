import type { GlobalPremiumStats, UserPremiumStats } from "#soundy/types";

/**
 * Type guard untuk UserPremiumStats
 */
export function isUserPremiumStats(
	stats: UserPremiumStats | GlobalPremiumStats,
): stats is UserPremiumStats {
	return "active" in stats && typeof stats.active === "boolean";
}

/**
 * Type guard untuk GlobalPremiumStats
 */
export function isGlobalPremiumStats(
	stats: UserPremiumStats | GlobalPremiumStats,
): stats is GlobalPremiumStats {
	return (
		"totalActiveUsers" in stats && typeof stats.totalActiveUsers === "number"
	);
}
