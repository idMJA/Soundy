import { inspect } from "node:util";
import type { AnyContext } from "seyfert";

/**
 * Get the inspected object.
 * @param {any} object The object to inspect.
 * @param {number} depth The depth to inspect.
 * @returns {string} The inspected object.
 */
// biome-ignore lint/suspicious/noExplicitAny: This utility is meant to inspect any value, so 'any' is required for flexibility.
export const getInspect = (object: any, depth: number): string =>
	inspect(object, { depth });

/**
 * Create and Get the cooldown collection key.
 * @param ctx The context.
 * @returns
 */
export const getCollectionKey = (ctx: AnyContext): string => {
	const authorId = ctx.author.id;

	if (ctx.isChat() || ctx.isMenu() || ctx.isEntryPoint())
		return `${authorId}-${ctx.fullCommandName}-command`;
	if (ctx.isComponent() || ctx.isModal())
		return `${authorId}-${ctx.customId}-component`;

	return `${authorId}-all`;
};

/**
 *
 * Representation of a object.
 * @param error The error.
 * @returns
 */

// biome-ignore lint/suspicious/noExplicitAny: This utility is meant to inspect any error or value, so 'any' is required for flexibility.
export const getDepth = (error: any, depth = 0): string =>
	inspect(error, { depth });

/**
 *
 * Slice text.
 * @param text The text.
 * @returns
 */
export const sliceText = (text: string, max = 100) =>
	text.length > max ? `${text.slice(0, max)}...` : text;
