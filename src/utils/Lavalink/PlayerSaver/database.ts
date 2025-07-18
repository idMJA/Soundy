import type { Logger } from "seyfert";
import type { Low } from "lowdb";
import type { DatabaseSchema } from "#soundy/types";

/**
 * Database operations for PlayerSaver
 */
export class DatabaseOperations {
	private db: Low<DatabaseSchema>;
	private logger: Logger;

	constructor(db: Low<DatabaseSchema>, logger: Logger) {
		this.db = db;
		this.logger = logger;
	}

	/**
	 * Initialize the database
	 */
	async init(): Promise<void> {
		try {
			// Load existing data
			await this.db.read();

			// Ensure the data structure exists
			if (!this.db.data) {
				this.db.data = { players: {}, sessions: {} };
			} else {
				// Make sure both players and sessions objects exist
				if (!this.db.data.players) this.db.data.players = {};
				if (!this.db.data.sessions) this.db.data.sessions = {};
			}

			// Save the initialized structure
			await this.safeWrite();
		} catch (error: unknown) {
			const err = error as { code?: string; syscall?: string; path?: string };
			if (
				err &&
				err.code === "ENOENT" &&
				err.syscall === "rename" &&
				err.path &&
				err.path.includes(".sessions.json.tmp")
			) {
				// Suppress this specific error
				return;
			}
			this.logger.error("Error initializing PlayerSaver:", error);
			this.db.data = { players: {}, sessions: {} };
			try {
				await this.safeWrite();
			} catch (writeError) {
				this.logger.error("Failed to write initial data:", writeError);
			}
		}
	}

	/**
	 * Ensure database is ready and data is loaded
	 */
	async ensureReady(): Promise<void> {
		await this.db.read();
		if (!this.db.data) {
			this.db.data = { players: {}, sessions: {} };
		}
	}

	/**
	 * Safe write operation
	 */
	private async safeWrite(): Promise<void> {
		try {
			await this.db.write();
		} catch (error) {
			const err = error as { code?: string; syscall?: string; path?: string };
			if (
				err &&
				err.code === "ENOENT" &&
				err.syscall === "rename" &&
				err.path &&
				err.path.includes(".sessions.json.tmp")
			) {
				// Suppress this specific error
				return;
			}
			throw error;
		}
	}

	/**
	 * Write changes to database
	 */
	async writeChanges(): Promise<void> {
		await this.safeWrite();
	}
}
