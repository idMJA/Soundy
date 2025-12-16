import type { Low } from "lowdb";
import type { Logger } from "seyfert";
import type { DatabaseSchema } from "#soundy/types";
import type { DatabaseOperations } from ".";

/**
 * Node session management operations
 */
export class NodeSessionManager {
	private db: Low<DatabaseSchema>;
	private logger: Logger;
	private dbOps: DatabaseOperations;

	constructor(
		db: Low<DatabaseSchema>,
		logger: Logger,
		dbOps: DatabaseOperations,
	) {
		this.db = db;
		this.logger = logger;
		this.dbOps = dbOps;
	}

	/**
	 * Clean up node sessions that don't exist in the provided node IDs
	 * @param validNodeIds Array of valid node IDs from nodes.ts
	 */
	async cleanupNodeSessions(validNodeIds: string[]): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data || !this.db.data.sessions) {
				return;
			}

			const currentSessions = this.db.data.sessions;
			const sessionsToRemove: string[] = [];

			for (const nodeId of Object.keys(currentSessions)) {
				if (!validNodeIds.includes(nodeId)) {
					sessionsToRemove.push(nodeId);
				}
			}

			if (sessionsToRemove.length > 0) {
				this.logger.info(
					`Removing ${sessionsToRemove.length} invalid node sessions: ${sessionsToRemove.join(", ")}`,
				);

				for (const nodeId of sessionsToRemove) {
					delete this.db.data.sessions[nodeId];
				}

				await this.dbOps.writeChanges();
				this.logger.info("Successfully cleaned up invalid node sessions");
			}
		} catch (error) {
			this.logger.error("Error cleaning up node sessions:", error);
		}
	}

	/**
	 * Save node session ID to the database
	 */
	async saveNodeSession(nodeId: string, sessionId: string): Promise<void> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data.sessions) {
				this.db.data.sessions = {};
			}

			this.db.data.sessions[nodeId] = sessionId;

			await this.dbOps.writeChanges();
		} catch (error) {
			this.logger.error(`Error saving session ID for node ${nodeId}:`, error);
		}
	}

	/**
	 * Get all saved node sessions
	 */
	async getAllNodeSessions(): Promise<Map<string, string>> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data.sessions) {
				this.db.data.sessions = {};
				await this.dbOps.writeChanges();
				return new Map();
			}

			const sessionMap = new Map<string, string>();
			for (const [nodeId, sessionId] of Object.entries(this.db.data.sessions)) {
				sessionMap.set(nodeId, sessionId);
			}

			return sessionMap;
		} catch (error) {
			this.logger.error("Error getting node sessions:", error);
			return new Map();
		}
	}

	/**
	 * Get a session ID for a specific node
	 */
	async getNodeSession(nodeId: string): Promise<string | null> {
		try {
			await this.dbOps.ensureReady();

			if (!this.db.data || !this.db.data.sessions) {
				return null;
			}

			return this.db.data.sessions[nodeId] || null;
		} catch (error) {
			this.logger.error(`Error getting session ID for node ${nodeId}:`, error);
			return null;
		}
	}
}
