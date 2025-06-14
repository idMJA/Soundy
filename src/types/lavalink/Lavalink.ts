import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type Soundy from "../../client/Soundy";

/**
 * All lavalink events.
 */
export type AllEvents = LavalinkManagerEvents & NodeManagerEvents;

/**
 * Enum to distinguish between Lavalink Manager and Node event types.
 */
export enum LavalinkEventTypes {
	Manager = 1,
	Node = 2,
}

/**
 * Combined type for all Lavalink events (Manager & Node).
 */
export type LavalinkEvents = LavalinkManagerEvents & NodeManagerEvents;

/**
 * Function signature for Lavalink event handlers.
 */
export type LavalinkEventRun<K extends keyof LavalinkEvents> = (
	client: Soundy,
	...args: Parameters<LavalinkEvents[K]>
) => Promise<void> | void;

/**
 * Resolves the event type (Manager or Node) based on the event key.
 */
export type LavalinkEventType<K extends keyof LavalinkEvents> =
	K extends keyof NodeManagerEvents
		? LavalinkEventTypes.Node
		: LavalinkEventTypes.Manager;

/**
 * Interface for defining a Lavalink event.
 */
export interface LavalinkEvent<
	K extends keyof LavalinkEvents = keyof LavalinkEvents,
> {
	/**
	 * Event name.
	 * @type {K}
	 */
	name: K;
	/**
	 * Event type (Manager or Node).
	 * @type {LavalinkEventType<K>}
	 */
	type: LavalinkEventType<K>;
	/**
	 * Event handler function.
	 * @type {LavalinkEventRun<K>}
	 */
	run: LavalinkEventRun<K>;
	/**
	 * If true, event runs only once.
	 * @type {boolean}
	 */
	once?: boolean;
}
