import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type {
	AllEvents,
	LavalinkEvent,
	LavalinkEventRun,
	LavalinkEventType,
} from "#soundy/types";
import { LavalinkEventTypes } from "#soundy/types";

/**
 * Represents a Lavalink event for Soundy with type-safe event registration and handling.
 *
 * @typeParam K - The event name key from {@link AllEvents}.
 *
 * @example
 * ```ts
 * const event = createLavalinkEvent({
 *   name: "nodeConnect",
 *   type: LavalinkEventTypes.Node,
 *   run: (node) => { ... }
 * });
 * ```
 */
export class Lavalink<K extends keyof AllEvents = keyof AllEvents>
	implements LavalinkEvent<K>
{
	/**
	 * The event name.
	 */
	readonly name: K;
	/**
	 * The event type (Node or Manager).
	 */
	readonly type: LavalinkEventType<K>;
	/**
	 * The event run function.
	 */
	readonly run: LavalinkEventRun<K>;

	/**
	 * Create a new Lavalink event.
	 * @param event - The event definition object.
	 */
	constructor(event: LavalinkEvent<K>) {
		this.name = event.name;
		this.type = event.type;
		this.run = event.run;
	}

	/**
	 * Check if the event is a `node` event.
	 * @returns True if this event is a node event.
	 */
	public isNode(): this is LavalinkNode {
		return this.type === LavalinkEventTypes.Node;
	}

	/**
	 * Check if the event is a `manager` event.
	 * @returns True if this event is a manager event.
	 */
	public isManager(): this is LavalinkManager {
		return this.type === LavalinkEventTypes.Manager;
	}
}

/**
 * Type alias for Lavalink events that are node events.
 */
type LavalinkNode = Lavalink<keyof NodeManagerEvents>;

/**
 * Type alias for Lavalink events that are manager events.
 */
type LavalinkManager = Lavalink<keyof LavalinkManagerEvents>;

/**
 * Helper to create a Lavalink event with type safety.
 *
 * @typeParam K - The event name key from {@link AllEvents}.
 * @param event - The event definition object.
 * @returns Lavalink event instance.
 */
export const createLavalinkEvent = <K extends keyof AllEvents>(
	event: LavalinkEvent<K>,
): Lavalink<K> => new Lavalink<K>(event);
