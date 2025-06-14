import type { AnyContext } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { EmbedColors } from "seyfert/lib/common";

/**
 *
 * The Soundy's default error handler.
 * @param ctx The context of the command.
 * @param error The error that was thrown.
 * @returns
 */
export async function onRunError(ctx: AnyContext, error: unknown) {
	await ctx.client.logger.error(error);

	const { event } = await ctx.getLocale();

	return ctx.editOrReply({
		flags: MessageFlags.Ephemeral,
		embeds: [
			{
				description: `${ctx.client.config.emoji.no} ${event.overrides.error}`,
				color: EmbedColors.Red,
			},
		],
	});
}
