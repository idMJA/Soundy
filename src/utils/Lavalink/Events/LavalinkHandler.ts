import { pathToFileURL } from "node:url";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { Lavalink } from "#soundy/utils";
import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type Soundy from "#soundy/client";

export class LavalinkHandler {
	// Map event name ke { event, filepath, run }
	public readonly values = new Map<
		string,
		{ event: Lavalink; filepath: string; run: (...args: unknown[]) => void }
	>();
	public readonly client: Soundy;

	constructor(client: Soundy) {
		this.client = client;
	}

	async load(directory = join(process.cwd(), "src/lavalink")): Promise<void> {
		const files = this.getFiles(directory);
		for (const file of files) {
			const imported = await this.dynamicImport(file);
			const event: Lavalink | undefined = imported?.default;
			if (
				!event ||
				typeof event !== "object" ||
				typeof event.run !== "function" ||
				(typeof event.isNode !== "function" &&
					typeof event.isManager !== "function")
			) {
				console.warn(`[LavalinkHandler] Skipping invalid event file: ${file}`);
				continue;
			}
			// Use a stable run function for each event
			const run = (...args: unknown[]) =>
				// biome-ignore lint/suspicious/noExplicitAny: Lavalink event arguments are dynamic and may not match strict typings, so 'any' is used for compatibility.
				event.run(this.client, ...(args as any));
			if (event.isNode()) {
				if ("once" in event && typeof event.once === "function" && event.once())
					this.client.manager.nodeManager.once(
						event.name as keyof NodeManagerEvents,
						run,
					);
				else
					this.client.manager.nodeManager.on(
						event.name as keyof NodeManagerEvents,
						run,
					);
			} else if (event.isManager()) {
				if ("once" in event && typeof event.once === "function" && event.once())
					this.client.manager.once(
						event.name as keyof LavalinkManagerEvents,
						run,
					);
				else
					this.client.manager.on(
						event.name as keyof LavalinkManagerEvents,
						run,
					);
			}
			this.values.set(event.name as string, { event, filepath: file, run });
		}
	}

	async reload(name: string): Promise<void> {
		const value = this.values.get(name);
		if (!value?.filepath) return;
		// Remove old listener before reloading
		if (value.event && value.run) {
			if (value.event.isNode()) {
				this.client.manager.nodeManager.removeListener(
					value.event.name as keyof NodeManagerEvents,
					value.run,
				);
			} else if (value.event.isManager()) {
				this.client.manager.removeListener(
					value.event.name as keyof LavalinkManagerEvents,
					value.run,
				);
			}
		}
		const imported = await this.dynamicImport(value.filepath);
		const newEvent: Lavalink | undefined = imported?.default;
		if (!newEvent) return;
		const run = (...args: unknown[]) =>
			// biome-ignore lint/suspicious/noExplicitAny: Lavalink event arguments are dynamic and may not match strict typings, so 'any' is used for compatibility.
			newEvent.run(this.client, ...(args as any));
		if (newEvent.isNode()) {
			if (
				"once" in newEvent &&
				typeof newEvent.once === "function" &&
				newEvent.once()
			)
				this.client.manager.nodeManager.once(
					newEvent.name as keyof NodeManagerEvents,
					run,
				);
			else
				this.client.manager.nodeManager.on(
					newEvent.name as keyof NodeManagerEvents,
					run,
				);
		} else if (newEvent.isManager()) {
			if (
				"once" in newEvent &&
				typeof newEvent.once === "function" &&
				newEvent.once()
			)
				this.client.manager.once(
					newEvent.name as keyof LavalinkManagerEvents,
					run,
				);
			else
				this.client.manager.on(
					newEvent.name as keyof LavalinkManagerEvents,
					run,
				);
		}
		this.values.set(newEvent.name as string, {
			event: newEvent,
			filepath: value.filepath,
			run,
		});
	}

	async reloadAll(): Promise<void> {
		this.client.manager.removeAllListeners();
		this.client.manager.nodeManager.removeAllListeners();
		for (const name of this.values.keys()) {
			await this.reload(name);
		}
	}

	private getFiles(dir: string): string[] {
		let results: string[] = [];
		for (const file of readdirSync(dir)) {
			const full = join(dir, file);
			if (statSync(full).isDirectory())
				results = results.concat(this.getFiles(full));
			else if ([".js", ".ts"].includes(extname(full))) results.push(full);
		}
		return results;
	}

	// biome-ignore lint/suspicious/noExplicitAny: This dynamic import utility must support any module type for flexibility.
	private async dynamicImport<T = any>(path: string): Promise<T> {
		return import(`${pathToFileURL(path)}?update=${Date.now()}`).then((x) =>
			x.default ? x : { default: x },
		);
	}
}
