import {
	Player,
	type SearchQuery,
	type SearchResult,
	type UnresolvedSearchResult,
} from "lavalink-client";
import type { SoundyManager } from "../../../client/modules/Manager";

/**
 * Check if a search error is a rate limit or recoverable 5xx error.
 * @param result Search result from Lavalink.
 * @param error Optional error thrown by the client.
 */
export function isRateLimitOrRecoverableSearchError(
	result: SearchResult | UnresolvedSearchResult | null | undefined,
	error?: unknown,
): boolean {
	if (error) {
		const message =
			error instanceof Error
				? `${error.message} ${error.stack || ""}`
				: String(error);
		if (
			/rate\s*limit|too\s*many\s*requests|429|quota|blocked|status\s*code\s*429|ip\s*banned/i.test(
				message,
			) ||
			/5\d{2}|internal\s*server\s*error|service\s*unavailable|bad\s*gateway|gateway\s*timeout/i.test(
				message,
			)
		) {
			return true;
		}
	}

	if (!result) return false;

	if (result.loadType === "error") {
		const exception = result.exception;
		if (exception) {
			const details = `${exception.message || ""} ${exception.cause || ""} ${exception.causeStackTrace || ""}`;
			if (
				/rate\s*limit|too\s*many\s*requests|429|quota|blocked|status\s*code\s*429|ip\s*banned/i.test(
					details,
				) ||
				/5\d{2}|internal\s*server\s*error|service\s*unavailable|bad\s*gateway|gateway\s*timeout/i.test(
					details,
				)
			) {
				return true;
			}
		}
		return true;
	}

	return false;
}

export class SoundyPlayer extends Player {
	public override async search(
		query: SearchQuery,
		requestUser: unknown,
		throwOnEmpty = false,
	): Promise<UnresolvedSearchResult | SearchResult> {
		const manager = this.LavalinkManager as SoundyManager;
		const fallbackPlatform = manager.client?.config.fallbackSearchPlatform;

		const transformedQuery = manager.utils.transformQuery(query);
		const rawQuery = transformedQuery.query;
		const isUrl = /^https?:\/\//.test(rawQuery);

		if (isUrl || !fallbackPlatform) {
			return super.search(query, requestUser, throwOnEmpty);
		}

		const initialSource =
			transformedQuery.source ||
			manager.options?.playerOptions?.defaultSearchPlatform ||
			manager.client?.config.defaultSearchPlatform;

		if (initialSource === fallbackPlatform) {
			return super.search(query, requestUser, throwOnEmpty);
		}

		try {
			const result = await super.search(query, requestUser, throwOnEmpty);

			if (isRateLimitOrRecoverableSearchError(result)) {
				manager.client?.logger.warn(
					`[Search Fallback] Primary search platform '${initialSource}' failed (loadType: ${result.loadType}${result.exception?.message ? `, message: ${result.exception.message}` : ""}). Falling back to '${fallbackPlatform}' for query: "${rawQuery}"`,
				);

				const fallbackQuery: SearchQuery =
					typeof query === "object"
						? { ...query, source: fallbackPlatform }
						: { query: rawQuery, source: fallbackPlatform };

				return await super.search(fallbackQuery, requestUser, throwOnEmpty);
			}

			return result;
		} catch (error) {
			if (isRateLimitOrRecoverableSearchError(undefined, error)) {
				manager.client?.logger.warn(
					`[Search Fallback] Primary search platform '${initialSource}' threw error (${error instanceof Error ? error.message : String(error)}). Falling back to '${fallbackPlatform}' for query: "${rawQuery}"`,
				);

				const fallbackQuery: SearchQuery =
					typeof query === "object"
						? { ...query, source: fallbackPlatform }
						: { query: rawQuery, source: fallbackPlatform };

				return await super.search(fallbackQuery, requestUser, throwOnEmpty);
			}

			throw error;
		}
	}
}
