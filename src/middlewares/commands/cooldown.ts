import { createMiddleware } from "seyfert";
import { getCollectionKey } from "#soundy/utils";

import { MessageFlags } from "seyfert/lib/types";

export const checkCooldown = createMiddleware<void>(
	async ({ context, next, pass }) => {
		const { client, command } = context;
		const { cooldowns } = client;

		const { event } = await context.getLocale();

		if (!command) return await pass();
		if ("onlyDeveloper" in command && command.onlyDeveloper)
			return await next();

		const cooldown =
			("cooldown" in command && typeof command.cooldown === "number"
				? command.cooldown
				: 3) * 1000;
		const timeNow = Date.now();

		const data = cooldowns.get(getCollectionKey(context));
		if (data && timeNow < data) {
			context.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: event.cooldown({
							seconds: Math.ceil((data - timeNow) / 1000),
						}),
						color: client.config.color.no,
					},
				],
			});

			return await pass();
		}

		cooldowns.set(getCollectionKey(context), timeNow + cooldown, cooldown);

		// Only run cooldown for commands, skip for components
		if (context.isComponent?.()) return await next();

		return await next();
	},
);
