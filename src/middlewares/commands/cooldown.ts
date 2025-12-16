import { createMiddleware } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { getCollectionKey } from "#soundy/utils";

export const checkCooldown = createMiddleware<void>(
	async ({ context, next, pass }) => {
		const { client, command } = context;
		const { cooldowns } = client;

		const { event } = await context.getLocale();

		if (!command) return pass();
		if ("onlyDeveloper" in command && command.onlyDeveloper) return next();

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

			return pass();
		}

		cooldowns.set(getCollectionKey(context), timeNow + cooldown, cooldown);

		if (context.isComponent?.()) return next();

		return next();
	},
);
