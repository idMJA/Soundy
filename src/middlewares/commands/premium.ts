import { ActionRow, Button, Embed, createMiddleware } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types";
import { SoundyCategory } from "#soundy/types";

const PREMIUM_CATEGORIES = [
	SoundyCategory.Music,
	SoundyCategory.Playlists,
	SoundyCategory.Filters,
];

const FREE_COMMANDS_LIMIT = 6;
const PREMIUM_TIME = 12; // in hours
const commandUsage = new Map<string, number>();

// Reset command usage every 12 hours
setInterval(
	() => {
		commandUsage.clear();
	},
	PREMIUM_TIME * 60 * 60 * 1000,
);

export const checkPremium = createMiddleware<void>(async (middle) => {
	const { context } = middle;
	const { client, command } = context;

	// Robust category detection
	let category: SoundyCategory | undefined;
	if ("category" in command && typeof command.category !== "undefined") {
		category = command.category as SoundyCategory;
	} else if (
		"constructor" in command &&
		typeof (command.constructor as unknown as { category?: SoundyCategory })
			.category !== "undefined"
	) {
		category = (command.constructor as unknown as { category?: SoundyCategory })
			.category;
	}

	const userId = context.author.id;

	const { event } = await context.getLocale();

	// Only run premium check for commands, skip for components
	if (context.isComponent?.()) return middle.next();

	if (
		category &&
		context.client.config.premium.enabled &&
		PREMIUM_CATEGORIES.includes(category)
	) {
		// Check if user has active premium from voting
		const premiumStatus =
			await context.client.database.getPremiumStatus(userId);
		if (premiumStatus) {
			middle.next();
			return;
		}

		const userUsage = commandUsage.get(userId) || 0;

		if (userUsage < FREE_COMMANDS_LIMIT) {
			// Increment usage and allow command
			commandUsage.set(userId, userUsage + 1);
			middle.next();
			return;
		}

		// User has exceeded free limit
		await context.editOrReply({
			embeds: [
				new Embed()
					.setColor(client.config.color.primary)
					.setDescription(
						`${event.premium.limit_reached.title}\n\n${event.premium.limit_reached.description({ time: PREMIUM_TIME })}`,
					),
			],
			components: [
				new ActionRow().addComponents(
					new Button()
						.setLabel(event.premium.vote_now)
						.setStyle(ButtonStyle.Link)
						.setURL(client.config.info.voteLink),
				),
			],
		});
		return;
	}

	middle.next();
});
