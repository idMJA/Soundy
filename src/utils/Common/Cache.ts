import { LimitedCollection } from "seyfert";
import { Configuration } from "#soundy/config";
import type { guild } from "#soundy/db";
import { SoundyKeys } from "#soundy/types";

interface Cache {
	[SoundyKeys.Locale]: typeof guild.$inferSelect;
	[SoundyKeys.Player]: typeof guild.$inferSelect;
	[SoundyKeys.Prefix]: typeof guild.$inferSelect;
}

/**
 * Main Soundy cache class.
 */
export class SoundyCache {
	/**
	 * The internal cache.
	 * @readonly
	 */
	readonly internal: LimitedCollection<
		string,
		LimitedCollection<SoundyKeys, unknown>
	> = new LimitedCollection({
		limit: Configuration.cache.size,
	});

	/**
	 * Get the data from the cache.
	 * @param guildId The guild id.
	 * @param key The key.
	 * @returns
	 */
	public get<T extends keyof Cache>(
		guildId: string,
		key: T,
	): Cache[T] | undefined {
		return this.internal.get(guildId)?.get(key) as Cache[T] | undefined;
	}

	/**
	 * Delete the data in the cache.
	 * @param guildId The guild id.
	 * @returns
	 */
	public delete(guildId: string): boolean {
		return this.internal.delete(guildId);
	}

	/**
	 * Delete the data in the cache.
	 * @param guildId The guild id.
	 * @param key The key.
	 * @returns
	 */
	public deleteKey<T extends keyof Cache>(guildId: string, key: T): boolean {
		return this.internal.get(guildId)?.delete(key) ?? false;
	}

	/**
	 * Set the data to the cache.
	 * @param guildId The guild id.
	 * @param key The key.
	 * @param data The data.
	 * @returns
	 */
	public set<T extends keyof Cache>(
		guildId: string,
		key: T,
		data: Cache[T],
	): void {
		if (this.internal.has(guildId) && !this.internal.get(guildId)?.has(key)) {
			this.internal.get(guildId)?.set(key, data);
			return;
		}

		const collection = new LimitedCollection<SoundyKeys, unknown>();
		collection.set(key, data);
		this.internal.set(guildId, collection);
	}
}
